import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getUserFromRequest();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("fb_pages_access_token")?.value;

    if (!accessToken) {
      return NextResponse.json({ error: "No access token" }, { status: 400 });
    }

    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,picture&access_token=${accessToken}`
    );

    if (!pagesRes.ok) {
      console.error("Failed to fetch Facebook pages", await pagesRes.text());
      return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
    }

    const pagesData: {
      data: {
        id: string;
        name: string;
        picture?: { data?: { url?: string } };
        access_token: string;
      }[];
    } = await pagesRes.json();

    const pages = pagesData.data.map(page => ({
      id: page.id,
      name: page.name,
      picture: page.picture?.data?.url || null,
    }));

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[Facebook Pages POST] Starting page selection');
    const { user, supabase } = await getUserFromRequest();
    if (!user) {
      console.error('[Facebook Pages POST] Unauthorized: no user');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log('[Facebook Pages POST] User authenticated:', user.id);

    const { pageId, context, flowId } = await req.json();
    console.log('[Facebook Pages POST] Received params:', { pageId, context, flowId });
    if (!pageId || !context) {
      console.error('[Facebook Pages POST] Missing parameters');
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("fb_pages_access_token")?.value;
    console.log('[Facebook Pages POST] Access token from cookie:', !!accessToken);
    if (!accessToken) {
      console.error('[Facebook Pages POST] No access token in cookie');
      return NextResponse.json({ error: "No access token" }, { status: 400 });
    }

    // Fetch Facebook page details
    console.log('[Facebook Pages POST] Fetching page details for:', pageId);
    const pageRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=id,name,picture,access_token&access_token=${accessToken}`
    );

    if (!pageRes.ok) {
      console.error("Failed to fetch Facebook page", await pageRes.text());
      return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 });
    }

    const pageData: {
      id: string;
      name: string;
      picture?: { data?: { url?: string } };
      access_token: string;
    } = await pageRes.json();
    console.log('[Facebook Pages POST] Page data fetched:', { id: pageData.id, name: pageData.name, hasToken: !!pageData.access_token, hasPicture: !!pageData.picture?.data?.url });

    // Use external picture URL directly
    const profilePictureUrl = pageData.picture?.data?.url || null;

    // Save to DB
    console.log('[Facebook Pages POST] Upserting to database');
    const { error: dbErr } = await supabase
      .from("platform_validation")
      .upsert({
        user_id: user.id,
        platform: "facebook",
        access_token: pageData.access_token,
        refresh_token: null,
        token_expires_at: null,
        platform_user_id: pageData.id,
        platform_username: pageData.name,
        profile_picture: profilePictureUrl,
      })
      .select()
      .single();
    if (dbErr) {
      console.error("Database insertion error:", dbErr);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    console.log('[Facebook Pages POST] Database upsert successful');

    // Build redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const redirectUrl = new URL(
      context === "edit-flow"
        ? `${baseUrl}/dashboard/edit-flow`
        : `${baseUrl}/dashboard/new-flow/destination`
    );

    if (context === "edit-flow" && flowId) {
      redirectUrl.searchParams.set("flowId", flowId);
    }

    redirectUrl.searchParams.set("platform", "facebook");
    redirectUrl.searchParams.set("username", pageData.name);
    if (profilePictureUrl)
      redirectUrl.searchParams.set("profile_picture", profilePictureUrl);
    redirectUrl.searchParams.set("access_token", pageData.access_token);
    redirectUrl.searchParams.set("account_id", pageData.id);
    redirectUrl.searchParams.set("name", pageData.name);
    redirectUrl.searchParams.set(
      "facebook_page",
      JSON.stringify({
        id: pageData.id,
        name: pageData.name,
        profile_picture: profilePictureUrl,
        access_token: pageData.access_token,
      })
    );

    console.log('[Facebook Pages POST] Returning success response');
    // 👇 Instead of redirecting, return the redirect URL
    return NextResponse.json({
      redirectUrl: redirectUrl.toString(),
      pageData: {
        id: pageData.id,
        name: pageData.name,
        profile_picture: profilePictureUrl,
        access_token: pageData.access_token,
      },
    });
  } catch (error) {
    console.error("Error selecting page:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
