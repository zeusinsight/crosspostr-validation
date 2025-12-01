import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const csrfState = Math.random().toString(36).substring(7);

  console.log('YouTube start: Generated CSRF state:', csrfState);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`;

  const scope = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline", // needed for refresh token
    include_granted_scopes: "true",
    state: csrfState,
    prompt: "consent", // show consent screen each time to ensure refresh token
  })}`;

  // Stocker le state en cookie serveur (httpOnly pour la sécurité)
  const response = NextResponse.redirect(authUrl);
  response.cookies.set("csrfState", csrfState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3600, // 1 heure
  });

  console.log('YouTube start: Set CSRF cookie with value:', csrfState);

  return response;
}
