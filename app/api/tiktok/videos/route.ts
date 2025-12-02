import { createAdminClient } from "@/lib/supabase/admin";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET endpoint to retrieve the authenticated user's TikTok videos
 * Returns a list of videos from the user's TikTok account
 */
export async function GET(req: NextRequest) {
  try {
    // Get user from request using the getUserFromRequest function as specified in user rules
    const { user } = await getUserFromRequest();
    const adminClient = createAdminClient();
    
    if (!user) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    // Get user's TikTok social connection
    const { data: conn, error: connErr } = await adminClient
      .from("platform_validation")
      .select("access_token, refresh_token, token_expires_at")
      .eq("user_id", user.id)
      .eq("platform", "tiktok")
      .single();

    if (connErr || !conn) {
      return NextResponse.json({ error: "tiktok_not_connected" }, { status: 400 });
    }

    // Check if token is expired and needs refresh
    const tokenExpiry = new Date(conn.token_expires_at);
    const now = new Date();
    
    // If token is expired or will expire in the next 5 minutes, refresh it
    if (tokenExpiry.getTime() - now.getTime() < 5 * 60 * 1000) {
      const refreshedToken = await refreshTikTokToken(conn.refresh_token, adminClient, user.id);
      if (!refreshedToken) {
        return NextResponse.json({ error: "token_refresh_failed" }, { status: 401 });
      }
      conn.access_token = refreshedToken;
    }

    // Get cursor from request query params if available
    const cursor = req.nextUrl.searchParams.get('cursor');
    const maxCount = req.nextUrl.searchParams.get('max_count') || '10';
    
    // Following the exact format from the TikTok API documentation example
    // curl -L -X POST 'https://open.tiktokapis.com/v2/video/list/?fields=cover_image_url,id,title' \
    // -H 'Authorization: Bearer act.example12345Example12345Example' \
    // -H 'Content-Type: application/json' \
    // --data-raw '{ "max_count": 20 }'
    
    // Build the fields parameter as a comma-separated list
    const fields = "id,title,cover_image_url,share_url,video_description,create_time,duration,height,width,view_count,like_count,comment_count,share_count";
    const apiUrl = `https://open.tiktokapis.com/v2/video/list/?fields=${fields}`;
    
    // Prepare request body according to the example
    const requestBody: Record<string, unknown> = {};
    
    // Add max_count parameter (default to 10, max 20)
    const limit = parseInt(maxCount, 10);
    if (!isNaN(limit) && limit > 0) {
      requestBody.max_count = Math.min(limit, 20);
    }
    
    // Add cursor parameter if available
    if (cursor && !isNaN(parseInt(cursor, 10))) {
      requestBody.cursor = parseInt(cursor, 10);
    }
    
    console.log("TikTok API request:", {
      url: apiUrl,
      body: requestBody,
      token: `Bearer ${conn.access_token.substring(0, 10)}...` // Log partial token for debugging
    });
    
    const videosResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${conn.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!videosResponse.ok) {
      try {
        const errorData = await videosResponse.json();
        console.error("TikTok API error:", {
          status: videosResponse.status,
          statusText: videosResponse.statusText,
          data: errorData
        });
        return NextResponse.json({ 
          error: "tiktok_api_error", 
          message: `Failed to fetch videos: ${videosResponse.status} ${JSON.stringify(errorData)}` 
        }, { status: videosResponse.status });
      } catch {
        const errorText = await videosResponse.text();
        console.error("TikTok API error (non-JSON):", {
          status: videosResponse.status,
          statusText: videosResponse.statusText,
          text: errorText
        });
        return NextResponse.json({ 
          error: "tiktok_api_error", 
          message: `Failed to fetch videos: ${videosResponse.status} ${errorText}` 
        }, { status: videosResponse.status });
      }
    }

    const videosData = await videosResponse.json();
    
    // Return the videos data with only ID and description
    const videos = videosData.data?.videos?.map((video: any) => ({
      id: video.id,
      description: video.video_description || video.title || ''
    })) || [];

    return NextResponse.json({
      videos,
      cursor: videosData.data?.cursor || null,
      has_more: videosData.data?.has_more || false
    });
    
  } catch (error: unknown) {
    console.error("Error fetching TikTok videos:", error);
    return NextResponse.json({ 
      error: "unexpected_error", 
      message: error instanceof Error ? error.message : "An unexpected error occurred" 
    }, { status: 500 });
  }
}

/**
 * Helper function to refresh TikTok access token
 */
async function refreshTikTokToken(
  refreshToken: string, 
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<string | null> {
  try {
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Failed to refresh token:", await tokenResponse.text());
      return null;
    }

    const tokenData = await tokenResponse.json();
    
    // Update the token in the database
    const { error: dbError } = await adminClient
      .from("social_connections")
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      })
      .eq("user_id", userId)
      .eq("platform", "tiktok");

    if (dbError) {
      console.error("Failed to update token in database:", dbError);
      return null;
    }

    return tokenData.access_token;
  } catch (error) {
    console.error("Error refreshing TikTok token:", error);
    return null;
  }
}


