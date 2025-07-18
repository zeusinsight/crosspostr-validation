"use client";

import { Button } from "@/components/ui/button";

export function TikTokLoginButton() {
  const handleTikTokLogin = () => {
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

    window.location.href = authUrl;
  };

  return (
    <Button
      variant="outline"
      onClick={handleTikTokLogin}
      className="flex items-center gap-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M19.321 5.562a5.122 5.122 0 0 1-.443-.258 6.228 6.228 0 0 1-1.138-1.009 6.244 6.244 0 0 1-1.866-4.314h-3.604v13.637c0 .042-.001.084-.003.126v.003a3.23 3.23 0 0 1-.982 2.159 3.247 3.247 0 0 1-2.267.935 3.234 3.234 0 0 1-3.248-3.248 3.234 3.234 0 0 1 3.248-3.248c.269 0 .529.034.779.097v-3.693A6.892 6.892 0 0 0 8.058 7c-3.815 0-6.908 3.093-6.908 6.908s3.093 6.908 6.908 6.908c3.815 0 6.908-3.093 6.908-6.908V9.45a9.835 9.835 0 0 0 4.355 1.018V6.855c-.314 0-.618-.038-.91-.11a5.157 5.157 0 0 1-.91-1.183z" />
      </svg>
      Connect TikTok
    </Button>
  );
}
