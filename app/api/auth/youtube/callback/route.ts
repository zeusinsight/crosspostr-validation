import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    console.error("YouTube auth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=youtube_auth_failed`
    );
  }

  try {
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
      console.error("Failed to exchange code", await tokenRes.text());
      throw new Error("Token exchange failed");
    }

    const tokenData: {
      access_token: string;
      expires_in: number;
      refresh_token?: string;
      scope: string;
      token_type: string;
      id_token?: string;
    } = await tokenRes.json();

    // Fetch channel info to get username/id
    const profileRes = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    if (!profileRes.ok) {
      console.error("Failed to fetch YouTube profile", await profileRes.text());
      throw new Error("Profile fetch failed");
    }

    const profileJson = await profileRes.json();
    const channel = profileJson.items?.[0];
    const channelId = channel?.id ?? null;
    const channelTitle = channel?.snippet?.title ?? null;

    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      throw new Error("User not authenticated");
    }

    const { error: dbErr } = await supabase
      .from("social_connections")
      .upsert({
        user_id: user.id,
        platform: "youtube",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token ?? null,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        platform_user_id: channelId,
        platform_username: channelTitle,
      })
      .select()
      .single();

    if (dbErr) throw dbErr;

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?success=youtube_connected`
    );
  } catch (e) {
    console.error("YouTube callback error:", e);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=youtube_connection_failed`
    );
  }
}
