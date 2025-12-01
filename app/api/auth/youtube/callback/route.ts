import { cookies } from "next/headers";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    console.error("YouTube auth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=youtube_auth_failed`
    );
  }

  const cookieStore = await cookies();
  const csrfState = cookieStore.get("csrfState")?.value;

  console.log('YouTube callback: All cookies:', cookieStore.getAll().map(c => ({ name: c.name, value: c.value })));
  console.log('YouTube callback: Received state from Google:', state);
  console.log('YouTube callback: CSRF state from cookie:', csrfState);

  if (!state || !csrfState || state !== csrfState) {
    console.log('YouTube callback: CSRF validation failed');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=invalid_csrf_state`
    );
  }

  console.log('YouTube callback: CSRF validation passed');

  try {
    console.log('YouTube callback: Starting token exchange');
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`,
        access_type: "offline",
      }),
    });

    if (!tokenRes.ok) {
      console.error('YouTube token exchange failed:', await tokenRes.text());
      throw new Error('Token exchange failed');
    }

    console.log('YouTube callback: Token exchange successful');
    const tokenData: {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope: string;
      token_type: string;
      id_token?: string;
    } = await tokenRes.json();

    console.log('YouTube callback: Token data received, refresh_token:', !!tokenData.refresh_token);
    // Fetch channel info to get username/id
    console.log('YouTube callback: Fetching channel info');
    const profileRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!profileRes.ok) {
      console.error('YouTube profile fetch failed:', await profileRes.text());
      throw new Error('Profile fetch failed');
    }

    console.log('YouTube callback: Profile fetch successful');
    const profileJson = await profileRes.json();
    const channel = profileJson.items?.[0];
    const channelId = channel?.id ?? null;
    const channelTitle = channel?.snippet?.title ?? null;
    const profilePicture = channel?.snippet?.thumbnails?.default?.url ?? null;

    console.log('YouTube callback: Channel info - ID:', channelId, 'Title:', channelTitle);
    const { user, supabase } = await getUserFromRequest();
    if (!user) {
      throw new Error('User not authenticated');
    }

    console.log('YouTube callback: User authenticated, user ID:', user.id);
    const upsertData = {
      user_id: user.id,
      platform: 'youtube',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? null,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      platform_user_id: channelId,
      platform_username: channelTitle,
      profile_picture: profilePicture,
    };
    console.log('YouTube callback: Upsert data:', upsertData);
    console.log('YouTube callback: Attempting database upsert');
    const { error: dbErr } = await supabase
      .from("platform_validation")
      .upsert(upsertData)
      .select()
      .single();

    if (dbErr) {
      console.error('YouTube callback: Database upsert error:', dbErr);
      throw dbErr;
    }

    console.log('YouTube callback: Database upsert successful');
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?success=youtube_connected`
    );
    response.cookies.delete("csrfState");
    return response;
  } catch (e) {
    console.error("YouTube callback error:", e);
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=youtube_connection_failed`
    );
    response.cookies.delete("csrfState");
    return response;
  }
}
