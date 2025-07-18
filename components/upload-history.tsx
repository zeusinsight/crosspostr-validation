"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

type DatabasePost = {
  id: string;
  platform: string;
  status: "pending" | "processing" | "published" | "error";
  error_message?: string;
  published_at?: string;
  video: {
    title: string;
    file_url: string;
    thumbnail_url?: string;
  };
};

interface Post {
  id: string;
  platform: string;
  status: "pending" | "processing" | "published" | "error";
  error_message?: string;
  published_at?: string;
  video: {
    title: string;
    file_url: string;
    thumbnail_url?: string;
  };
}

export function UploadHistory() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const supabase = createClient();

    // Initial fetch
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          platform,
          status,
          error_message,
          published_at,
          video:videos (title, file_url, thumbnail_url)
        `)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE)
        .returns<DatabasePost[]>();

      if (error) {
        console.error("Error fetching posts:", error);
        return;
      }

      setPosts(data || []);
      setHasMore(data?.length === PAGE_SIZE);
      setIsLoading(false);
    };

    // Set up real-time subscription
    const subscription = supabase
      .channel("posts_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          // When a post is updated, fetch the complete post data including video details
          if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
            const { data, error } = await supabase
              .from("posts")
              .select(`
                id,
                platform,
                status,
                error_message,
                published_at,
                video:videos (
                  title,
                  file_url,
                  thumbnail_url
                )
              `)
              .eq("id", payload.new.id)
              .single<DatabasePost>();

            if (!error && data) {
              setPosts(prev => {
                const index = prev.findIndex(p => p.id === data.id);
                if (index >= 0) {
                  const newPosts = [...prev];
                  newPosts[index] = data;
                  return newPosts;
                }
                return [data, ...prev];
              });
            }
          }
        }
      )
      .subscribe();

    fetchPosts();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getStatusBadge = (status: Post["status"]) => {
    const variants: Record<Post["status"], "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      processing: "default",
      published: "default",
      error: "destructive",
    };

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload History</CardTitle>
          <CardDescription>Loading your upload history...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload History</CardTitle>
        <CardDescription>Track the status of your video uploads</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {posts.length === 0 && !isLoading ? (
            <p className="text-center text-muted-foreground">
              No uploads yet. Start by uploading a video!
            </p>
          ) : (
            posts.map(post => (
              <div
                key={post.id}
                className="flex items-start space-x-4 p-4 border rounded-lg"
              >
                {post.video.thumbnail_url ? (
                  <img
                    src={post.video.thumbnail_url}
                    alt={post.video.title}
                    className="w-24 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-24 h-16 bg-accent rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">No thumbnail</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{post.video.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm capitalize">{post.platform}</span>
                    {getStatusBadge(post.status)}
                  </div>
                  {post.error_message && (
                    <p className="text-sm text-destructive mt-1">
                      {post.error_message}
                    </p>
                  )}
                  {post.published_at && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Published {new Date(post.published_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
