"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TikTokLoginButton } from "./tiktok-login-button";
import { InstagramLoginButton } from "./instagram-login-button";
import { YouTubeLoginButton } from "./youtube-login-button";
import { createClient } from "@/lib/supabase/client";

type Platform = "tiktok" | "instagram" | "youtube";

interface SocialConnection {
  platform: Platform;
  platform_username: string | null;
  access_token: string | null;
  refresh_token: string | null;
  connected: boolean;
}

export function SocialConnections() {
  const [isLoading, setIsLoading] = useState(true);
  const [connections, setConnections] = useState<SocialConnection[]>([
    { platform: "tiktok", platform_username: null, access_token: null, refresh_token: null, connected: false },
    { platform: "instagram", platform_username: null, access_token: null, refresh_token: null, connected: false },
    { platform: "youtube", platform_username: null, access_token: null, refresh_token: null, connected: false },
  ]);

  useEffect(() => {
    const loadConnections = async () => {
      const supabase = createClient();
      const { data: socialConnections, error } = await supabase
        .from("social_connections")
        .select("platform, access_token, refresh_token, platform_username");

      if (error) {
        console.error("Error loading social connections:", error);
        return;
      }

      setConnections(prev =>
        prev.map(conn => {
          const existingConnection = socialConnections?.find(
            sc => sc.platform === conn.platform
          );
          return existingConnection
            ? {
                ...conn,
                access_token: "demo_access_token",
                refresh_token: "demo_refresh_token",
                platform_username: existingConnection.platform_username,
                connected: true,
              }
            : conn;
        })
      );
      setIsLoading(false);
    };

    loadConnections();
  }, []);

  const handleConnect = async (platform: Platform) => {
    // In a real implementation, this would redirect to the platform's OAuth flow
    // For demo purposes, we'll just update the local state and database
    const username = window.prompt(`Enter your ${platform} username for demo:`);
    if (!username) return;

    const supabase = createClient();
    const { error } = await supabase.from("social_connections").upsert({
      platform,
      platform_username: username,
      // Demo values for tokens
      access_token: "demo_access_token",
      refresh_token: "demo_refresh_token",
      token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    });

    if (error) {
      console.error("Error connecting account:", error);
      return;
    }

    setConnections(prev =>
      prev.map(conn =>
        conn.platform === platform
          ? { ...conn, platform_username: username, connected: true }
          : conn
      )
    );
  };

  const handleDisconnect = async (platform: Platform) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("social_connections")
      .delete()
      .eq("platform", platform);

    if (error) {
      console.error("Error disconnecting account:", error);
      return;
    }

    setConnections(prev =>
      prev.map(conn =>
        conn.platform === platform
          ? { ...conn, platform_username: null, connected: false }
          : conn
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts to enable cross-posting
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading connections...</div>
        ) : (
          <div className="grid gap-4">
            {connections.map(({ platform, platform_username, connected }) => (
              <div
                key={platform}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <h3 className="font-medium capitalize">{platform}</h3>
                  {platform_username && (
                    <p className="text-sm text-gray-500">@{platform_username}</p>
                  )}
                </div>
                {platform === "tiktok" ? (
                  <TikTokLoginButton />
                ) : platform === "instagram" ? (
                  <InstagramLoginButton />
                ) : platform === "youtube" ? (
                  <YouTubeLoginButton />
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleConnect(platform)}
                    disabled={connected || isLoading}
                  >
                    Connect
                  </Button>
                )}
                <Button
                  variant={connected ? "destructive" : "default"}
                  onClick={() =>
                    connected ? handleDisconnect(platform) : handleConnect(platform)
                  }
                >
                  {connected ? "Disconnect" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
