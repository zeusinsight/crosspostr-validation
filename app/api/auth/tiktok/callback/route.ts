import { cookies } from "next/headers";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  if (error || !code) {
    console.error("TikTok auth error:", error, error_description);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=tiktok_auth_failed`
    );
  }

  const cookieStore = await cookies();
  const csrfState = cookieStore.get("csrfState")?.value;

  if (!state || !csrfState || state !== csrfState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=invalid_csrf_state`
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cache-Control": "no-cache",
      },
      body: new URLSearchParams({
        client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();
    // Get user info
    const userResponse = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=username,avatar_url,open_id", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }
    
    const userData = await userResponse.json();
    console.log(userData)
    const { user, supabase } = await getUserFromRequest();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error: dbError } = await supabase
      .from("platform_validation")
      .upsert({
        user_id: user.id,
        platform: "tiktok",
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        platform_user_id: userData.data.user.open_id,
        platform_username: userData.data.user.username,
        profile_picture: userData.data.user.avatar_url,
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?success=tiktok_connected`
    );
    response.cookies.delete("csrfState");
    return response;
  } catch (error) {
    console.error("Error connecting TikTok:", error);
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/protected?error=tiktok_connection_failed`
    );
    response.cookies.delete("csrfState");
    return response;
  }
}
