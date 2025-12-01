import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const csrfState = Math.random().toString(36).substring(7);

  const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

  // Permissions Instagram Business API
  const scope = "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights";

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${csrfState}`;

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
