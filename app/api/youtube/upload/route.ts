import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
// We don't need fs or stream in this implementation
import { getUserFromRequest } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
export async function POST(req: NextRequest) {
  // Use the getUserFromRequest function as specified in user rules
  const { user, supabase } = await getUserFromRequest();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";

  let file: File | null = null;
  let description = "";
  let tags: string[] = [];
  let isShorts = false;

  if (contentType.startsWith("multipart/form-data")) {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
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
    .from("platform_validation")
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
        .from("platform_validation")
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
      console.warn('Continuing with YouTube upload despite storage error');
    }

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
    
    console.log(`[YouTube] Starting upload for video: ${description}`);
    
    // Use fetch directly instead of googleapis library
    const videoMetadata = {
      snippet: {
        title: description,
        description,
        tags,
        categoryId: '22', // People & Blogs category
      },
      status: {
        privacyStatus: 'public',
        selfDeclaredMadeForKids: false,
      },
    };
    
    // Get the file content
    const arrayBuffer = await file.arrayBuffer();
    const fileData = Buffer.from(arrayBuffer);
    const fileSize = fileData.length;
    const fileType = file.type || 'video/mp4';
    
    // Make sure description is not too long (YouTube has a 100 character limit for titles)
    if (description.length > 100) {
      description = description.slice(0, 97) + '...';
    }
    
    console.log(`[YouTube] Initiating upload session for video: ${description} (${fileSize} bytes)`);
    
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
