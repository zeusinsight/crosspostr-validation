import { cookies } from "next/headers";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    console.error("Instagram auth error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=instagram_auth_failed`
    );
  }

  const cookieStore = await cookies();
  const csrfState = cookieStore.get("csrfState")?.value;

  if (!state || !csrfState || state !== csrfState) {
    console.error("CSRF validation failed - state mismatch");
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=invalid_csrf_state`
    );
  }

  try {
    // Exchange code for short-lived access token
    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,
        code,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Failed to exchange code for token", await tokenRes.text());
      throw new Error("Token exchange failed");
    }

    const tokenData: {
      access_token: string;
      user_id: string;
    } = await tokenRes.json();

    // Exchange the short-lived token for a long-lived token (valid for ~60 days)
    const longLivedTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${tokenData.access_token}`
    );

    if (!longLivedTokenRes.ok) {
      console.error(
        "Long-lived token exchange failed:",
        await longLivedTokenRes.text()
      );
      throw new Error("Long-lived token exchange failed");
    }

    const longLivedTokenData: {
      access_token: string;
      token_type: string;
      expires_in: number;
    } = await longLivedTokenRes.json();

    const accessToken = longLivedTokenData.access_token;

    // Fetch user info (id, username, profile picture)
    const userInfoRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username,profile_picture_url&access_token=${accessToken}`
    );

    if (!userInfoRes.ok) {
      console.error("Failed to fetch Instagram user info", await userInfoRes.text());
      throw new Error("User info fetch failed");
    }

    const userInfo: {
      id: string;
      username: string;
      profile_picture_url?: string;
    } = await userInfoRes.json();

    const { user, supabase } = await getUserFromRequest();
    if (!user) {
      throw new Error("User not authenticated");
    }
    const { error: dbErr } = await supabase
      .from("platform_validation")
      .upsert({
        user_id: user.id,
        platform: "instagram",
        access_token: longLivedTokenData.access_token,
        refresh_token: null,
        token_expires_at: new Date(Date.now() + longLivedTokenData.expires_in * 1000).toISOString(),
        platform_user_id: userInfo.id,
        platform_username: userInfo.username,
        profile_picture: userInfo.profile_picture_url,
      })
      .select()
      .single();

    if (dbErr) {
      console.error("Database insertion error:", dbErr);
      throw dbErr;
    }

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?success=instagram_connected`
    );
    response.cookies.delete("csrfState");
    return response;
  } catch (e) {
    console.error("Instagram callback error:", e);
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=instagram_connection_failed`
    );
    response.cookies.delete("csrfState");
    return response;
  }
}
