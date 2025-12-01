"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useCallback } from "react";

export type Platform = "tiktok" | "instagram" | "youtube" | "facebook";

export interface SocialConnection {
  platform: Platform;
  platform_username: string | null;
  profile_picture: string | null;
  platform_user_id: string | null;
  connected: boolean;
}

export const useSocialConnections = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [connections, setConnections] = useState<SocialConnection[]>([
    { platform: "tiktok", platform_username: null, profile_picture: null, platform_user_id: null, connected: false },
    { platform: "instagram", platform_username: null, profile_picture: null, platform_user_id: null, connected: false },
    { platform: "youtube", platform_username: null, profile_picture: null, platform_user_id: null, connected: false },
    { platform: "facebook", platform_username: null, profile_picture: null, platform_user_id: null, connected: false },
  ]);
  const [error, setError] = useState<string | null>(null);

  const loadConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: socialConnections, error: dbError } = await supabase
      .from("platform_validation")
      .select("platform, platform_username, profile_picture, platform_user_id");

    if (dbError) {
      console.error("Error loading social connections:", dbError);
      setError(dbError.message);
      setIsLoading(false);
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
              platform_username: existingConnection.platform_username,
              profile_picture: existingConnection.profile_picture,
              platform_user_id: existingConnection.platform_user_id,
              connected: true,
            }
          : { ...conn, connected: false, profile_picture: null, platform_username: null, platform_user_id: null };
      })
    );
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  const handleDisconnect = async (platform: Platform) => {
    const supabase = createClient();
    const { error: dbError } = await supabase
      .from("platform_validation")
      .delete()
      .eq("platform", platform);

    if (dbError) {
      console.error("Error disconnecting account:", dbError);
      setError(dbError.message);
    } else {
      // Refresh connections from the server
      await loadConnections();
    }
  };

  return { connections, isLoading, error, handleDisconnect, refreshConnections: loadConnections };
};
