import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { getUserFromRequest } from "@/lib/auth";

function b64urlToBuffer(input: string) {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + "==".slice((2 - (input.length * 3) % 4) % 4);
  return Buffer.from(b64, "base64");
}

function verifyStateCookie(value: string) {
  try {
    const [payloadB64url, sigB64url] = value.split(".");
    if (!payloadB64url || !sigB64url) return null;
    const payloadBuf = b64urlToBuffer(payloadB64url);
    const sigBuf = b64urlToBuffer(sigB64url);
    const secret = process.env.FACEBOOK_CLIENT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-secret";
    const expectedSig = createHmac("sha256", secret).update(payloadBuf).digest();
    if (expectedSig.length !== sigBuf.length) return null;
    let valid = 0;
    for (let i = 0; i < expectedSig.length; i++) valid |= expectedSig[i] ^ sigBuf[i];
    if (valid !== 0) return null;
    const parsed = JSON.parse(payloadBuf.toString("utf8"));
    return parsed as { uid: string; nonce: string; ts: number; context?: string; flowId?: string };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    console.error("Facebook auth error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/protected?error=facebook_auth_failed`);
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

    // 1) Exchange code for access token
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code,
    }).toString()}`);

    if (!tokenRes.ok) {
      console.error("Failed to exchange Facebook code", await tokenRes.text());
      throw new Error("Token exchange failed");
    }
    const tokenData: {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token: string;
    } = await tokenRes.json();

    const accessToken = tokenData.access_token;

    // 2) Fetch user pages
const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?fields=id,name,picture,access_token&access_token=${accessToken}`);
if (!pagesRes.ok) {
  console.error("Failed to fetch Facebook pages", await pagesRes.text());
  throw new Error("Pages fetch failed");
}
const pagesData: {
  data: {
    id: string;
    name: string;
    picture?: { data?: { url?: string } };
    access_token: string;
  }[];
} = await pagesRes.json();


    // 3) Validate state from query vs cookie for CSRF protection
    const stateParam = searchParams.get("state") || "";
    verifyStateCookie(stateParam);

    // 4) Ensure user authenticated
    const { user } = await getUserFromRequest();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // If pages exist, redirect back to originating page with flag to show dialog
    if (pagesData.data.length > 0) {
      const isSecure = redirectUri.startsWith("https://");
      const res = NextResponse.redirect(`${baseUrl}/protected?facebookPages=true`);
      res.cookies.set("fb_pages_access_token", accessToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: isSecure,
        path: "/",
        maxAge: 10 * 60, // 10 minutes
      });
      return res;
    }

    return NextResponse.redirect(`${baseUrl}/protected`);
  } catch (e) {
    console.error("Facebook callback error:", e);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/protected?error=facebook_connection_failed`);
  }
}
