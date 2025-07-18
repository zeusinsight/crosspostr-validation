"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";

interface TikTokVideo {
  id: string;
  title: string;
  cover_image_url: string;
  share_url: string;
  video_description: string;
  create_time: string; // ISO date string in v2 API
  duration: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  height: number;
  width: number;
}

interface TikTokVideosResponse {
  videos: TikTokVideo[];
  cursor: string | null;
  has_more: boolean;
}

export function TikTokVideos() {
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'not_connected' | 'unknown'>('unknown');

  const fetchVideos = async (cursorParam?: string | null) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = cursorParam 
        ? `/api/tiktok/videos?cursor=${encodeURIComponent(cursorParam)}` 
        : '/api/tiktok/videos';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if the error is due to TikTok not being connected
        if (errorData.error === 'tiktok_not_connected') {
          setConnectionStatus('not_connected');
        }
        
        throw new Error(errorData.message || 'Failed to fetch TikTok videos');
      } else {
        setConnectionStatus('connected');
      }
      
      const data: TikTokVideosResponse = await response.json();
      
      if (cursorParam) {
        setVideos(prev => [...prev, ...data.videos]);
      } else {
        setVideos(data.videos);
      }
      
      setCursor(data.cursor);
      setHasMore(data.has_more);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching TikTok videos');
      console.error('Error fetching TikTok videos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const loadMore = () => {
    if (cursor) {
      fetchVideos(cursor);
    }
  };

  // Format date from ISO string to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  if (loading && !refreshing && videos.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading TikTok videos...</span>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading TikTok videos</h3>
            <div className="mt-2 text-sm text-red-700 dark:text-red-300">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Try again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Your TikTok Videos</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {connectionStatus === 'not_connected' ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="font-medium">TikTok account not connected</p>
          <p className="text-sm text-muted-foreground mt-2">Connect your TikTok account to view and manage your videos.</p>
          <Button 
            className="mt-4" 
            asChild
          >
            <a href="/protected?connect=tiktok">Connect TikTok</a>
          </Button>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">No TikTok videos found.</p>
          <p className="text-sm text-muted-foreground mt-2">Upload videos to your TikTok account to see them here.</p>
          <div className="mt-4 flex justify-center gap-4">
            <Button 
              variant="outline" 
              asChild
            >
              <a href="https://www.tiktok.com/upload" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Upload on TikTok
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden flex flex-col">
              <div className="aspect-[9/16] relative bg-muted">
                {video.cover_image_url ? (
                  <img
                    src={video.cover_image_url}
                    alt={video.title || "TikTok video"}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-muted">
                    <span className="text-muted-foreground">No thumbnail</span>
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatDuration(video.duration)}
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-2">{video.title || "Untitled video"}</CardTitle>
                <CardDescription className="text-xs">
                  {formatDate(video.create_time)}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pb-2 flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {video.video_description || "No description"}
                </p>
              </CardContent>
              
              <CardFooter className="pt-0 flex flex-col gap-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <div className="flex space-x-4">
                    <span>{video.view_count?.toLocaleString() || '0'} views</span>
                    <span>{video.like_count?.toLocaleString() || '0'} likes</span>
                  </div>
                  <a 
                    href={video.share_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    View <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load more videos"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
