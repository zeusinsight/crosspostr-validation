import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Handles the OAuth callback from Facebook.
 * 1. Exchanges the authorization code for a short-lived user access token.
 * 2. Exchanges the short-lived token for a long-lived user access token (60 days).
 * 3. Fetches the user's Facebook Pages.
 * 4. For the first page found, gets the associated Instagram Business Account ID.
 * 5. Stores the long-lived Page Access Token and Instagram User ID in Supabase.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/protected`;

  if (error || !code) {
    console.error("Facebook auth error:", error);
    return NextResponse.redirect(
      `${redirectUrl}?error=facebook_auth_failed&error_description=${error}`
    );
  }

  try {
    // 1. Exchange code for a short-lived user access token
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_CLIENT_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_CLIENT_SECRET!);
    tokenUrl.searchParams.set(
      "redirect_uri",
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`
    );
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error?.message || "Token exchange failed");

    const shortLivedUserToken = tokenData.access_token;

    // 2. Exchange for a long-lived user access token
    const longLivedTokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    longLivedTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedTokenUrl.searchParams.set("client_id", process.env.FACEBOOK_CLIENT_ID!);
    longLivedTokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_CLIENT_SECRET!);
    longLivedTokenUrl.searchParams.set("fb_exchange_token", shortLivedUserToken);

    const longLivedTokenRes = await fetch(longLivedTokenUrl);
    const longLivedTokenData = await longLivedTokenRes.json();
    if (!longLivedTokenRes.ok) throw new Error(longLivedTokenData.error?.message || "Long-lived token exchange failed");

    const longLivedUserAccessToken = longLivedTokenData.access_token;

    // 3. Get user's pages (we need the page access token)
    const pagesUrl = `https://graph.facebook.com/me/accounts?access_token=${longLivedUserAccessToken}`;
    const pagesRes = await fetch(pagesUrl);
    const pagesData = await pagesRes.json();
    if (!pagesRes.ok) throw new Error(pagesData.error?.message || "Failed to fetch pages");

    const page = pagesData.data?.[0];
    if (!page) throw new Error("No Facebook Page found for this user.");

    const pageAccessToken = page.access_token;
    const pageId = page.id;

    // 4. Get the Instagram Business Account connected to the Page
    const igAccountUrl = `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`;
    const igAccountRes = await fetch(igAccountUrl);
    const igAccountData = await igAccountRes.json();
    if (!igAccountRes.ok) throw new Error(igAccountData.error?.message || "Failed to fetch Instagram account");

    const igUserId = igAccountData.instagram_business_account?.id;
    if (!igUserId) throw new Error("No Instagram Business Account linked to this Facebook Page.");

    // 5. Get IG username
    const igUsernameUrl = `https://graph.facebook.com/v19.0/${igUserId}?fields=username&access_token=${pageAccessToken}`;
    const igUsernameRes = await fetch(igUsernameUrl);
    const igUsernameData = await igUsernameRes.json();
    const igUsername = igUsernameData.username ?? "";

    // 6. Store the page access token and IG user ID in Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error: dbErr } = await supabase
      .from("social_connections")
      .upsert({
        user_id: user.id,
        platform: "instagram",
        access_token: pageAccessToken, // This is the Page Access Token, which is what we need
        refresh_token: null, // Page tokens can be refreshed differently, or use long-lived
        token_expires_at: null, // Long-lived tokens are valid for ~60 days, handle refresh separately
        platform_user_id: igUserId,
        platform_username: igUsername,
      }, { onConflict: 'user_id, platform' });

    if (dbErr) throw dbErr;

    return NextResponse.redirect(`${redirectUrl}?success=instagram_connected`);

  } catch (e: any) {
    console.error("Facebook callback error:", e);
    return NextResponse.redirect(`${redirectUrl}?error=instagram_connection_failed&error_description=${e.message}`);
  }
}
