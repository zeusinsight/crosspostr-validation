import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "edge";

// POST /api/instagram/upload
// multipart/form-data { file, title }
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

  let publicUrl: string | null = null;
  let file: File | null = null;
  let caption = "";

  if (contentType.startsWith("application/json")) {
    const body = await req.json();
    publicUrl = body.video_url as string | null;
    caption = body.title ?? "";
    if (!publicUrl) {
      return NextResponse.json({ error: "video_url_required" }, { status: 400 });
    }
  } else if (contentType.startsWith("multipart/form-data")) {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    caption = (formData.get("title") as string | null) ?? "";
    if (!file) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "unsupported_content_type" }, { status: 400 });
  }

  // Fetch IG connection
  const { data: conn, error: connErr } = await supabase
    .from("social_connections")
    .select("access_token, platform_user_id")
    .eq("user_id", user.id)
    .eq("platform", "instagram")
    .single();

  if (connErr || !conn) {
    return NextResponse.json({ error: "instagram_not_connected" }, { status: 400 });
  }

  const accessToken = conn.access_token as string;
  const igUserId = conn.platform_user_id as string;

  // If we don't yet have a publicUrl (i.e., multipart upload), first upload the file to Supabase Storage
  if (!publicUrl) {
    const admin = createAdminClient();
    const ext = (file!.name?.split(".").pop()) || "mp4";
    const storagePath = `instagram/${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("videos").upload(storagePath, file!, {
      contentType: file!.type || "video/mp4",
      upsert: false,
    });
    if (uploadErr) {
      console.error("Storage upload error", uploadErr);
      return NextResponse.json({ error: "storage_upload_failed" }, { status: 500 });
    }
    publicUrl = admin.storage.from("videos").getPublicUrl(storagePath).data.publicUrl;
  }

  try {
    // 1. Create container
    const createRes = await fetch(
      `https://graph.instagram.com/${igUserId}/media?media_type=REELS&video_url=${encodeURIComponent(publicUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`,
      {
        method: "POST",
      },
    );
    const createJson = await createRes.json();
    if (!createRes.ok) {
      console.error("IG container error", createJson);
      throw new Error(createJson.error?.message || "container_error");
    }
    const containerId = createJson.id as string;

    // Poll for FINISHED status before publishing
    console.log(`[Instagram] Container ${containerId} created, waiting for processing...`);
    
    let status = "IN_PROGRESS";
    let attempts = 0;
    const maxAttempts = 20; // Increase max attempts
    const delayMs = 5000; // 5 seconds between checks
    
    // Keep polling until we get FINISHED status or hit max attempts
    while (attempts < maxAttempts && status !== "FINISHED") {
      await new Promise(r => setTimeout(r, delayMs));
      attempts++;
      
      try {
        const statusRes = await fetch(
          `https://graph.instagram.com/${containerId}?fields=status_code,error_message&access_token=${accessToken}`,
        );
        const statusJson = await statusRes.json();
        
        console.log(`[Instagram] Status check ${attempts}/${maxAttempts}:`, JSON.stringify(statusJson));
        
        // Get status from response
        status = statusJson.status_code || statusJson.status || status;
        
        // Check for errors
        if (statusJson.error) {
          console.error(`[Instagram] Status check error:`, statusJson.error);
          break;
        }
        
        // If we get ERROR status, stop polling
        if (status === "ERROR") {
          console.error(`[Instagram] Processing failed with ERROR status`);
          break;
        }
        
        // If we get FINISHED, we're good to go
        if (status === "FINISHED") {
          console.log(`[Instagram] Processing completed successfully`);
          break;
        }
      } catch (err) {
        console.error(`[Instagram] Status check request failed:`, err);
      }
    }
    
    // If we didn't reach FINISHED status, we can still try to publish
    // Some videos might show ERROR but still be publishable
    if (status !== "FINISHED") {
      console.warn(`[Instagram] Video processing status is ${status}, but we'll try publishing anyway`);
    }

    // 3. Publish
    const publishRes = await fetch(
      `https://graph.instagram.com/${igUserId}/media_publish?creation_id=${containerId}&access_token=${accessToken}`,
      {
        method: "POST",
      },
    );
    const publishJson = await publishRes.json();
    if (!publishRes.ok) {
      console.error("IG publish error", publishJson);
      throw new Error(publishJson.error?.message || "publish_error");
    }

    return NextResponse.json({ success: true, instagram_post_id: publishJson.id });
  } catch (e: unknown) {
    console.error("Instagram upload error", e);
    return NextResponse.json({ error: "upload_failed", message: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
