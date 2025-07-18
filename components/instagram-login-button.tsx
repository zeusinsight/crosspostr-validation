"use client";

import { Button } from "@/components/ui/button";

export function InstagramLoginButton() {
  const handleInstagramLogin = () => {
    const csrfState = Math.random().toString(36).substring(7);
    const clientId = process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`;

    // Instagram Basic Display API scopes
    const scope = "user_profile,user_media";
    const responseType = "code";

    const authUrl = `https://api.instagram.com/oauth/authorize?${new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri,
      scope,
      response_type: responseType,
      state: csrfState,
    })}`;
    console.log(authUrl);

    window.location.href = "https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=1147790550416573&redirect_uri=https://positively-emerging-mite.ngrok-free.app/api/auth/instagram/callback&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights";
  };

  return (
    <Button
      variant="outline"
      onClick={handleInstagramLogin}
      className="flex items-center gap-2"
    >
      {/* Instagram logo */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5Zm8.75 2.25a1 1 0 1 1 2 0 1 1 0 0 1-2 0ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
      </svg>
      Connect Instagram
    </Button>
  );
}
