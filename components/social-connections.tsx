"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocialConnections } from "@/hooks/use-social-connections";

const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "tiktok":
      return (
        <Image
          src="/tiktoklogo.png"
          alt="tiktok logo"
          width={40}
          height={40}
          className="text-black"
        />
      );
    case "instagram":
      return (
        <Image
          src="/instagramlogo.webp"
          alt="Instagram logo"
          width={40}
          height={40}
          className="text-black"
        />
        
      );
    case "youtube":
      return (
        <Image
          src="/Youtube_logo.png"
          alt="YouTube logo"
          width={40}
          height={40}
          className="text-black"
        />
      );
    case "facebook":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    default:
      return <div className="w-10 h-10 bg-gray-200 rounded-full" />;
  }
};

export function SocialConnections() {
  const { connections, isLoading, handleDisconnect } = useSocialConnections();

  const connectedPlatform = connections.find(c => c.connected);
  const displayConnections = connectedPlatform ? [connectedPlatform] : connections;

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
            {displayConnections.map(({ platform, platform_username, connected, profile_picture }) => (
                <div key={platform} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <PlatformIcon platform={platform} />
                    
                    {connected ? (
                      <div className="flex items-start gap-4">
                        {profile_picture && (
                          <Image src={profile_picture} alt={platform_username || platform} width={40} height={40} className="h-10 w-10 rounded-full" />
                        )}
                        
                        <div className="space-y-1">
                          <h3 className="font-medium capitalize">{platform}</h3>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium"></span> @{platform_username}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="font-medium capitalize">{platform}</h3>
                        <p className="text-sm text-muted-foreground">Not connected</p>
                      </div>
                    )}
                  </div>
                  {connected ? (
                    <Button
                      variant="destructive"
                      onClick={() => handleDisconnect(platform)}
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = `/api/auth/${platform}/start`}
                      size="sm"
                    >
                      Connect
                    </Button>
                  )}
                </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
