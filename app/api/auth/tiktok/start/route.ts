import { NextResponse } from "next/server";

export async function GET() {
  const csrfState = Math.random().toString(36).substring(7);

  const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`;

  const scope = "user.info.basic,user.info.profile,video.publish,video.list";
  const responseType = "code";

  const authUrl = `https://www.tiktok.com/v2/auth/authorize?${new URLSearchParams({
    client_key: clientKey!,
    scope,
    response_type: responseType,
    redirect_uri: redirectUri,
    state: csrfState,
  })}`;

  // Stocker le state en cookie serveur (httpOnly pour la sécurité)
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("csrfState", csrfState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600, // 1 heure
  });

  return response;
}
