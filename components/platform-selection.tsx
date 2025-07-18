"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface Platform {
  id: string;
  name: "tiktok" | "instagram" | "youtube";
  isConnected: boolean;
  isSelected: boolean;
}

export function PlatformSelection({
  onSelectionChange,
}: {
  onSelectionChange: (platforms: string[]) => void;
}) {
  const [platforms, setPlatforms] = useState<Platform[]>([
    { id: "tiktok", name: "tiktok", isConnected: false, isSelected: false },
    { id: "instagram", name: "instagram", isConnected: false, isSelected: false },
    { id: "youtube", name: "youtube", isConnected: false, isSelected: false },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConnectedPlatforms = async () => {
      const supabase = createClient();
      const { data: connections, error } = await supabase
        .from("social_connections")
        .select("platform");

      if (error) {
        console.error("Error loading social connections:", error);
        return;
      }

      const connectedPlatforms = connections.map(conn => conn.platform);
      setPlatforms(prev =>
        prev.map(platform => ({
          ...platform,
          isConnected: connectedPlatforms.includes(platform.name),
        }))
      );
      setIsLoading(false);
    };

    loadConnectedPlatforms();
  }, []);

  const handleCheckboxChange = (platformId: string, checked: boolean) => {
    setPlatforms(prev =>
      prev.map(platform =>
        platform.id === platformId
          ? { ...platform, isSelected: checked }
          : platform
      )
    );

    const selectedPlatforms = platforms
      .map(platform =>
        platform.id === platformId
          ? { ...platform, isSelected: checked }
          : platform
      )
      .filter(p => p.isSelected)
      .map(p => p.id);

    onSelectionChange(selectedPlatforms);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Platforms</CardTitle>
          <CardDescription>Loading platforms...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Platforms</CardTitle>
        <CardDescription>Choose where to share your video</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {platforms.map(platform => (
            <div
              key={platform.id}
              className="flex items-center space-x-4 p-4 border rounded-lg"
            >
              <div className="flex-1">
                <Label
                  htmlFor={platform.id}
                  className="flex flex-col space-y-1"
                >
                  <span className="font-medium capitalize">{platform.name}</span>
                  {!platform.isConnected && (
                    <span className="text-sm text-muted-foreground">
                      Not connected
                    </span>
                  )}
                </Label>
              </div>
              <Checkbox
                id={platform.id}
                checked={platform.isSelected}
                onCheckedChange={(checked) => 
                  handleCheckboxChange(platform.id, checked as boolean)
                }
                disabled={!platform.isConnected}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
