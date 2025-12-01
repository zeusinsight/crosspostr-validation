import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";

// POST /api/facebook/upload
// Accepts multipart/form-data with { file, description }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
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

  // Upload file to Supabase storage for backup
  const adminSupabase = await createAdminClient();
  const fileName = `${user.id}/${Date.now()}_${file.name}`;
  const { error: uploadErr } = await adminSupabase.storage
    .from('videos')
    .upload(fileName, file);

  if (uploadErr) {
    console.error('Supabase upload error', uploadErr);
    // Don't fail the request, just log the error
    console.warn('Continuing with Facebook upload despite storage error');
  }

  // Fetch Facebook connection
  const { data: conn, error: connErr } = await supabase
    .from("platform_validation")
    .select("access_token, platform_user_id")
    .eq("user_id", user.id)
    .eq("platform", "facebook")
    .single();

  if (connErr || !conn) {
    return NextResponse.json({ error: "facebook_not_connected" }, { status: 400 });
  }

  const accessToken = conn.access_token as string;
  const pageId = conn.platform_user_id as string;

  try {
    // Direct file upload using multipart/form-data
    const formData = new FormData();
    formData.append("source", file);
    formData.append("title", description);
    formData.append("description", description);
    formData.append("access_token", accessToken);

    const uploadRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/videos`,
      {
        method: "POST",
        body: formData,
      }
    );

    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) {
      console.error("Facebook video upload error", uploadJson);
      throw new Error(uploadJson.error?.message || "upload_error");
    }

    const videoId = uploadJson.id;

    return NextResponse.json({ success: true, facebook_video_id: videoId });
  } catch (e: unknown) {
    console.error("Facebook upload error", e);

    return NextResponse.json({ error: "upload_failed", message: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}