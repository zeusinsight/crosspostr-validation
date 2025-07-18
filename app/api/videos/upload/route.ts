import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  if (!(req.headers.get("content-type") || "").startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "content_type_must_be_multipart" }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = (formData.get("title") as string | null) ?? "";
  const description = (formData.get("description") as string | null) ?? "";
  const platformsRaw = (formData.get("platforms") as string | null) ?? "[]";
  let platforms: string[] = [];
  try { platforms = JSON.parse(platformsRaw); } catch {}

  if (!file) return NextResponse.json({ error: "file_required" }, { status: 400 });

  const admin = createAdminClient();
  const ext = (file.name?.split(".").pop()) || "mp4";
  const storagePath = `videos/${crypto.randomUUID()}.${ext}`;
  const { error: uploadErr } = await admin.storage.from("videos").upload(storagePath, file, {
    contentType: file.type || "video/mp4",
    upsert: false,
  });
  if (uploadErr) {
    console.error("Storage upload error", uploadErr);
    return NextResponse.json({ error: "storage_upload_failed" }, { status: 500 });
  }
  const publicUrl = admin.storage.from("videos").getPublicUrl(storagePath).data.publicUrl;

  const { data: videoData, error: dbErr } = await supabase.from("videos").insert({
    user_id: user.id,
    title,
    description,
    file_url: publicUrl,
    status: "processing",
  }).select();
  if (dbErr || !videoData?.[0]) {
    console.error("DB insert error", dbErr);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  const videoId = videoData[0].id;

  if (platforms.length) {
    const posts = platforms.map(p => ({ platform: p, video_id: videoId, status: "pending" }));
    const { error: postsErr } = await supabase.from("posts").insert(posts);
    if (postsErr) console.error("Posts insert error", postsErr);
  }

  return NextResponse.json({ success: true, video_id: videoId, file_url: publicUrl });
}
