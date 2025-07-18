import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import axios from "axios";
// We don't need fs or stream in this implementation
import { getUserFromRequest } from "@/lib/auth";
// Note: Make sure the lib/auth.ts file is properly configured

// POST /api/youtube/upload
// multipart/form-data { file, title, description, tags }
export async function POST(req: NextRequest) {
  // Use the getUserFromRequest function as specified in user rules
  const { user, supabase } = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  let publicUrl: string | null = null;
  let file: File | null = null;
  let title = "";
  let description = "";
  let tags: string[] = [];
  let isShorts = false;

  if (contentType.startsWith("application/json")) {
    const body = await req.json();
    publicUrl = body.video_url as string | null;
    title = body.title ?? "";
    description = body.description ?? "";
    tags = body.tags ?? [];
    isShorts = body.isShorts === true;
    if (!publicUrl) {
      return NextResponse.json({ error: "video_url_required" }, { status: 400 });
    }
  } else if (contentType.startsWith("multipart/form-data")) {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
    title = (formData.get("title") as string | null) ?? "";
    description = (formData.get("description") as string | null) ?? "";
    const tagsString = (formData.get("tags") as string | null) ?? "";
    tags = tagsString.split(",").filter(tag => tag.trim() !== "").map(tag => tag.trim());
    isShorts = (formData.get("isShorts") as string | null) === "true";
    
    if (!file) {
      return NextResponse.json({ error: "file_required" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "unsupported_content_type" }, { status: 400 });
  }

  // Fetch YouTube connection
  const { data: conn, error: connErr } = await supabase
    .from("social_connections")
    .select("access_token, refresh_token, token_expires_at")
    .eq("user_id", user.id)
    .eq("platform", "youtube")
    .single();

  if (connErr || !conn) {
    return NextResponse.json({ error: "youtube_not_connected" }, { status: 400 });
  }

  let accessToken = conn.access_token;
  const refreshToken = conn.refresh_token;
  const tokenExpiresAt = conn.token_expires_at ? new Date(conn.token_expires_at) : null;

  // Check if token is expired and refresh if needed
  if (tokenExpiresAt && tokenExpiresAt < new Date()) {
    try {
      // Use fetch API to refresh token instead of googleapis
      const refreshParams = new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: refreshParams.toString()
      });
      
      if (!refreshResponse.ok) {
        throw new Error(`Failed to refresh token: ${refreshResponse.statusText}`);
      }
      
      const tokenData = await refreshResponse.json();
      accessToken = tokenData.access_token;
      
      // Calculate expiry time (default to 1 hour if not provided)
      const expiresIn = tokenData.expires_in || 3600;
      const expiryDate = new Date(Date.now() + expiresIn * 1000);
      
      // Update the token in the database
      await supabase
        .from("social_connections")
        .update({
          access_token: accessToken,
          token_expires_at: expiryDate.toISOString(),
        })
        .eq("user_id", user.id)
        .eq("platform", "youtube");
    } catch (err) {
      console.error("Failed to refresh YouTube token:", err);
      return NextResponse.json({ error: "token_refresh_failed" }, { status: 401 });
    }
  }

  // If we don't yet have a publicUrl (i.e., multipart upload), first upload the file to Supabase Storage
  if (!publicUrl && file) {
    const admin = createAdminClient();
    const ext = (file.name?.split(".").pop()) || "mp4";
    const storagePath = `youtube/${crypto.randomUUID()}.${ext}`;
    const { error: uploadErr } = await admin.storage.from("videos").upload(storagePath, file, {
      contentType: file.type || "video/mp4",
      upsert: false,
    });
    if (uploadErr) {
      console.error("Storage upload error", uploadErr);
      return NextResponse.json({ error: "storage_upload_failed" }, { status: 500 });
    }
    publicUrl = admin.storage.from("videos").getPublicUrl(storagePath).data.publicUrl;
  }

  try {
    // Prepare description for Shorts if needed
    if (isShorts) {
      // Add #shorts hashtag if not already present
      if (!description.includes('#shorts')) {
        description = `${description}\n\n#shorts`;
      }
      
      // Add to tags if not already present
      if (!tags.includes('shorts')) {
        tags.push('shorts');
      }
      
      console.log(`[YouTube] Uploading as YouTube Shorts`);
    }
    
    console.log(`[YouTube] Starting upload for video: ${title}`);
    
    // Use fetch directly instead of googleapis library
    const videoMetadata = {
      snippet: {
        title,
        description,
        tags,
        categoryId: '22', // People & Blogs category
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    };
    
    // Get the file content and size if we have a file
    let fileData: Buffer | null = null;
    let fileSize = 0;
    let fileType = 'video/mp4';
    
    if (file) {
      // For file uploads, we need to get the buffer and size
      const arrayBuffer = await file.arrayBuffer();
      fileData = Buffer.from(arrayBuffer);
      fileSize = fileData.length;
      fileType = file.type || 'video/mp4';
    } else if (publicUrl) {
      // For URL uploads, we need to download the file first
      try {
        const response = await fetch(publicUrl);
        if (!response.ok) {
          throw new Error(`Failed to download video from URL: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        fileData = Buffer.from(arrayBuffer);
        fileSize = fileData.length;
        fileType = response.headers.get('content-type') || 'video/mp4';
      } catch (err: unknown) {
        console.error(`[YouTube] Failed to download video from URL:`, err);
        throw new Error(`Failed to download video from URL: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    if (!fileData) {
      throw new Error('No file data available for upload');
    }
    
    // Make sure title is not too long (YouTube has a 100 character limit)
    if (title.length > 100) {
      title = title.slice(0, 97) + '...';
    }
    
    console.log(`[YouTube] Initiating upload session for video: ${title} (${fileSize} bytes)`);
    
    // Step 1: Create upload session
      const initResponse = await axios.post(
        'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
        videoMetadata,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Upload-Content-Length': fileSize,
            'X-Upload-Content-Type': fileType,
          },
        }
      );
      
      if (initResponse.status !== 200) {
        console.error(`[YouTube] Failed to create upload session:`, initResponse.data);
        throw new Error(`Failed to create upload session: ${JSON.stringify(initResponse.data)}`);
      }
      
      // Get the upload URL from the Location header
      const uploadUrl = initResponse.headers.location;
      if (!uploadUrl) {
        throw new Error('No upload URL received from YouTube API');
      }
      
      console.log(`[YouTube] Upload session created, URL: ${uploadUrl}`);
      
      // Step 2: Upload the video content
      const uploadResponse = await axios.put(
        uploadUrl,
        fileData,
        {
          headers: {
            'Content-Type': fileType,
            'Content-Length': fileSize,
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (uploadResponse.status !== 200 && uploadResponse.status !== 201) {
        console.error(`[YouTube] Upload failed:`, uploadResponse.data);
        throw new Error(`Upload failed: ${JSON.stringify(uploadResponse.data)}`);
      }
      
      const videoData = uploadResponse.data;
      const videoId = videoData.id;
      
      console.log(`[YouTube] Upload successful, video ID: ${videoId}`);
      
      return NextResponse.json({ 
        success: true, 
        youtube_video_id: videoId,
        youtube_video_url: `https://www.youtube.com/watch?v=${videoId}` 
      });
    
  } catch (e: unknown) {
    console.error("YouTube upload error:", e);
    
    // Try to extract a meaningful error message
    let errorMessage = e instanceof Error ? e.message : String(e);
    if (e && typeof e === 'object' && 'response' in e) {
      const response = (e as Record<string, unknown>).response;
      if (response && typeof response === 'object' && 'data' in response) {
        const data = response.data as Record<string, unknown>;
        if (data?.error && typeof data.error === 'object' && 'message' in data.error) {
          errorMessage = String(data.error.message);
        }
      }
    }
    
    return NextResponse.json({ 
      error: "upload_failed", 
      message: errorMessage 
    }, { status: 500 });
  }
}
