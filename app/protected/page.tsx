"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SocialConnections } from "@/components/social-connections";
import { VideoUpload } from "@/components/video-upload";
import { Button } from "@/components/ui/button";
import { TikTokVideos } from "@/components/tiktok-videos";
import { useEffect, useState } from "react";

export default function ProtectedPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data?.user) {
        router.push("/auth/login");
      } else {
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center gap-4 py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">CrossPostr Dashboard</h1>
        <form action="/auth/signout" method="post">
          <Button variant="outline" type="submit">Sign Out</Button>
        </form>
      </div>
      
      <div className="grid gap-8">
        <div className="grid md:grid-cols-2 gap-8">
          <SocialConnections />
          <VideoUpload />
          <TikTokVideos />
        </div>
      </div>
    </div>
  );
}
