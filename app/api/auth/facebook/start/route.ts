import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHmac } from "node:crypto";
import { getUserFromRequest } from "@/lib/auth";

function base64url(input: Buffer | string) {
  const str = (input instanceof Buffer ? input : Buffer.from(input))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return str;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const context = searchParams.get("context") || "destination";
  const flowId = searchParams.get("flowId");

  const { user } = await getUserFromRequest();
  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`
    );
  }

  // Create CSRF state payload and sign it so we can verify later
  const nonce = base64url(randomBytes(16));
  const payload = JSON.stringify({ uid: user.id, nonce, ts: Date.now(), context, flowId });
  const secret =
    process.env.FACEBOOK_CLIENT_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-secret";
  const sig = createHmac("sha256", secret).update(payload).digest();
  const value = `${base64url(Buffer.from(payload))}.${base64url(sig)}`;

  const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID!;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
  const scope = [
    "public_profile",
    "email",
    "pages_show_list",
    "pages_read_engagement",
    "pages_manage_posts",
  ].join(",");

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    state: value,
  })}`;

  const isSecure = redirectUri.startsWith("https://");
  const res = NextResponse.redirect(authUrl);
  // Persist signed state cookie for verification in callback
  res.cookies.set("fb_state", value, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 10 * 60, // 10 minutes
  });

  return res;
}
