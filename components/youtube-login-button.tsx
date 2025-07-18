"use client";

import { Button } from "@/components/ui/button";

export function YouTubeLoginButton() {
  const handleYouTubeLogin = () => {
    const csrfState = Math.random().toString(36).substring(7);
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

    window.location.href = authUrl;
  };

  return (
    <Button
      variant="outline"
      onClick={handleYouTubeLogin}
      className="flex items-center gap-2"
    >
      {/* YouTube logo */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="16"
        height="16"
        fill="currentColor"
      >
        <path d="M21.8 8s-.2-1.4-.8-2a2.8 2.8 0 0 0-2-1.1C16.4 4.5 12 4.5 12 4.5h0s-4.4 0-7 .4a2.8 2.8 0 0 0-2 1.1c-.6.6-.8 2-.8 2S2 9.6 2 11.1v1.8c0 1.6.2 3.1.2 3.1s.2 1.4.8 2a2.9 2.9 0 0 0 2 1.1c2.6.3 10.8.3 10.8.3s4.4 0 7-.4a2.9 2.9 0 0 0 2-1.1c.6-.6.8-2 .8-2s.2-1.5.2-3.1v-1.8c0-1.5-.2-3.1-.2-3.1ZM10 14.8V9.2l5.2 2.8Z" />
      </svg>
      Connect YouTube
    </Button>
  );
}
