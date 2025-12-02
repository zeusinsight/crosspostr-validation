"use client";

import { useEffect, useState } from "react";

interface Video {
  id: string;
  description: string;
}

export function TikTokVideosList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch("/api/tiktok/videos");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch videos");
        }
        const data = await response.json();
        setVideos(data.videos || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">TikTok Videos</h2>
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">TikTok Videos</h2>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">TikTok Videos</h2>
      {videos.length === 0 ? (
        <p className="text-muted-foreground">No videos found. Make sure your TikTok account is connected.</p>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video.id} className="border rounded p-4">
              <p className="font-medium">ID: {video.id}</p>
              <p className="text-sm text-muted-foreground">Description: {video.description || "No description"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
