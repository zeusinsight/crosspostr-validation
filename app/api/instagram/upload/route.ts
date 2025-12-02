import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// POST /api/instagram/upload
// multipart/form-data { file, description }
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

  // Upload file to Supabase storage first to get a public URL for Instagram API
  const adminSupabase = await createAdminClient();
  const fileName = `${user.id}/${Date.now()}_${file.name}`;
  const { error: uploadErr } = await adminSupabase.storage
    .from('videos')
    .upload(fileName, file);

  if (uploadErr) {
    console.error('Supabase upload error', uploadErr);
    return NextResponse.json({ error: 'file_upload_failed' }, { status: 500 });
  }

  // Get public URL for the uploaded file
  const { data: { publicUrl } } = adminSupabase.storage
    .from('videos')
    .getPublicUrl(fileName);

  // Fetch IG connection
  const { data: conn, error: connErr } = await supabase
    .from('platform_validation')
    .select('access_token, platform_user_id')
    .eq('user_id', user.id)
    .eq('platform', 'instagram')
    .single();

  if (connErr || !conn) {
    return NextResponse.json({ error: 'instagram_not_connected' }, { status: 400 });
  }

  const accessToken = conn.access_token as string;
  const igUserId = conn.platform_user_id as string;

  try {
    // Create media container for Instagram Reel using video_url
    const uploadRes = await fetch(
      `https://graph.instagram.com/${igUserId}/media?media_type=REELS&video_url=${encodeURIComponent(publicUrl)}&caption=${encodeURIComponent(description)}&access_token=${accessToken}`,
      {
        method: 'POST',
      }
    );

    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) {
      console.error("Instagram video upload error", uploadJson);
      throw new Error(uploadJson.error?.message || "upload_error");
    }

    const containerId = uploadJson.id;

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
