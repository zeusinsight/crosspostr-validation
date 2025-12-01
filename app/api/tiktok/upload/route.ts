import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // faster upload handling

/**
 * Expects multipart/form-data with fields:
 *  - file: video binary (<= 1min, mp4/mov)
 *  - description: caption for the video
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // get user's tiktok social connection
  const { data: conn, error: connErr } = await supabase
    .from("platform_validation")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("platform", "tiktok")
    .single();

  if (connErr || !conn) {
    return NextResponse.json({ error: "tiktok_not_connected" }, { status: 400 });
  }

  const contentType = req.headers.get("content-type") || "";

  let file: File | null = null;
  let description = "";

  if (contentType.startsWith("multipart/form-data")) {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    description = (formData.get("description") as string | null) ?? "";
    if (!file) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "unsupported_content_type" }, { status: 400 });
  }

  try {
    // Upload file to Supabase storage for backup
    const adminSupabase = await createAdminClient();
    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await adminSupabase.storage
      .from('videos')
      .upload(fileName, file);

    if (uploadErr) {
      console.error('Supabase upload error', uploadErr);
      // Don't fail the request, just log the error
      console.warn('Continuing with TikTok upload despite storage error');
    }

    // Direct file upload approach for TikTok
    const fileBuffer = await file.arrayBuffer();
    const fileBlob = new Blob([fileBuffer], { type: file.type });

    // 1. Initialize upload session
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: description,
          privacy_level: "SELF_ONLY",
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: fileBlob.size,
          chunk_size: fileBlob.size, // Upload in single chunk
          total_chunk_count: 1,
        },
      }),
    });
    if (!initRes.ok) {
      const errorText = await initRes.text();
      console.error(`TikTok init failed with status ${initRes.status}:`, errorText);
      throw new Error(`TikTok init failed: ${initRes.status} - ${errorText}`);
    }
    const initData = await initRes.json();
    const { upload_url, publish_id } = initData.data;

    // 2. Upload file directly to TikTok
    if (upload_url) {
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Range": `bytes 0-${fileBlob.size - 1}/${fileBlob.size}`,
        },
        body: fileBlob,
      });
      if (!uploadRes.ok) {
        const uploadErrorText = await uploadRes.text();
        console.error(`TikTok upload failed with status ${uploadRes.status}:`, uploadErrorText);
        throw new Error(`TikTok upload failed: ${uploadRes.status} - ${uploadErrorText}`);
      }
    }

    return NextResponse.json({ success: true, publish_id });
  } catch (e: unknown) {
    console.error("TikTok upload error", e);
    return NextResponse.json({ error: "upload_failed", message: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
