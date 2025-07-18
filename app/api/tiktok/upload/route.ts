import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // faster upload handling

/**
 * Expects multipart/form-data with fields:
 *  - file: video binary (<= 1min, mp4/mov)
 *  - title: optional caption/title
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // get user's tiktok social connection
  const { data: conn, error: connErr } = await supabase
    .from("social_connections")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("platform", "tiktok")
    .single();

  if (connErr || !conn) {
    return NextResponse.json({ error: "tiktok_not_connected" }, { status: 400 });
  }

  const contentType = req.headers.get("content-type") || "";

  let publicUrl: string | null = null;
  let file: File | null = null;
  let title = "";

  if (contentType.startsWith("application/json")) {
    const body = await req.json();
    publicUrl = body.video_url as string | null;
    title = body.title ?? "";
    if (!publicUrl) {
      return NextResponse.json({ error: "video_url_required" }, { status: 400 });
    }
  } else if (contentType.startsWith("multipart/form-data")) {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    title = (formData.get("title") as string | null) ?? "";
    if (!file) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "unsupported_content_type" }, { status: 400 });
  }

  // If we don't yet have a publicUrl, upload to Storage
  if (!publicUrl) {
    const adminClient = createAdminClient();
    const ext = (file!.name?.split(".").pop()) || "mp4";
    const storagePath = `tiktok/${crypto.randomUUID()}.${ext}`;
    const { error: storageErr } = await adminClient.storage.from("videos").upload(storagePath, file!, {
      contentType: file!.type || "video/mp4",
      upsert: false,
    });
    if (storageErr) {
      console.error("Storage upload error", storageErr);
      return NextResponse.json({ error: "storage_upload_failed" }, { status: 500 });
    }
    publicUrl = adminClient.storage.from("videos").getPublicUrl(storagePath).data.publicUrl;
  }


    try {
    // 1. Initialize upload session
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${conn.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title,
          privacy_level: "SELF_ONLY",
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: publicUrl,
        },
      }),
    });
    if (!initRes.ok) throw new Error(await initRes.text());
    const initData = await initRes.json();
    const { upload_url, publish_id } = initData.data;

    // If FILE_UPLOAD flow, TikTok returns upload_url; for PULL_FROM_URL it's undefined.
    if (upload_url && file) {
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: file.stream(),
      });
      if (!uploadRes.ok) throw new Error(await uploadRes.text());
    }

    let commitData: unknown = null;
    if (upload_url) {
      // FILE_UPLOAD flow — need commit
      const commitRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/commit/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${conn.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publish_id }),
      });
      if (!commitRes.ok) throw new Error(await commitRes.text());
      commitData = await commitRes.json();
    }

    return NextResponse.json({ success: true, publish_id, commit: commitData });
  } catch (e: unknown) {
    console.error("TikTok upload error", e);
    return NextResponse.json({ error: "upload_failed", message: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
