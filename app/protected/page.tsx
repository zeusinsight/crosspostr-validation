"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SocialConnections } from "@/components/social-connections";
import { VideoUpload } from "@/components/video-upload";
import { FacebookPageSelector } from "@/components/facebook-page-selector";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useSocialConnections } from "@/hooks/use-social-connections";

export default function ProtectedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [showFacebookSelector, setShowFacebookSelector] = useState(false);
  const { refreshConnections } = useSocialConnections();
  
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

  useEffect(() => {
    const facebookPages = searchParams.get("facebookPages");
    if (facebookPages === "true") {
      setShowFacebookSelector(true);
    }
  }, [searchParams]);

  const handlePageSelected = async () => {
    // Page selected, refresh the connections to show the new connection
    await refreshConnections();
  };

  const handleCloseSelector = () => {
    setShowFacebookSelector(false);
    // Remove facebookPages from URL
    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete("facebookPages");
    router.replace(`/protected?${newSearchParams.toString()}`, { scroll: false });
  };

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
      </div>
      
      <div className="grid gap-8">
        <div className="grid md:grid-cols-2 gap-8">
          <SocialConnections />
          <VideoUpload />
        </div>
      </div>
      {showFacebookSelector && (
        <FacebookPageSelector
          onPageSelected={handlePageSelected}
          onClose={handleCloseSelector}
        />
      )}
    </div>
  );
}
