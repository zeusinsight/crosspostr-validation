"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { PlatformSelection } from "./platform-selection";
import { toast } from "sonner";

interface VideoUploadFormData {
  title: string;
  description: string;
  file: File | null;
  platforms: string[];
}

export function VideoUpload() {
  const router = useRouter();
  const [formData, setFormData] = useState<VideoUploadFormData>({
    title: "",
    description: "",
    file: null,
    platforms: [],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".mov", ".avi", ".mkv"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.title) {
      setError("Please provide a title and video file");
      return;
    }

    if (formData.platforms.length === 0) {
      setError("Please select at least one platform to post to");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload to Supabase storage via backend route
      const uploadFd = new FormData();
      uploadFd.append("file", formData.file);
      uploadFd.append("title", formData.title);
      uploadFd.append("description", formData.description);
      uploadFd.append("platforms", JSON.stringify(formData.platforms));

      const uploadRes = await fetch("/api/videos/upload", {
        method: "POST",
        body: uploadFd,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload video");
      }

      const { file_url: publicUrl } = await uploadRes.json();

      // 2. Call platform-specific endpoints in parallel
      const platformCalls = formData.platforms.map((platform) => {
        return fetch(`/api/${platform}/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            video_url: publicUrl,
            title: formData.title,
            description: formData.description,
          }),
        }).then((res) => {
          if (!res.ok) {
            throw new Error(`${platform} upload failed`);
          }
        });
      });

      await Promise.all(platformCalls);

      toast.success("Video uploaded successfully and platform uploads initiated");

      // Reset form and refresh
      setFormData({ title: "", description: "", file: null, platforms: [] });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while uploading");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
        <CardDescription>
          Upload a video to share across your social media platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter video title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter video description"
              rows={4}
            />
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <input {...getInputProps()} />
            {formData.file ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected file:</p>
                <p className="text-sm text-muted-foreground">{formData.file.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {isDragActive ? "Drop the video here" : "Drag & drop a video here"}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to select a file
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Target Platforms</Label>
            <PlatformSelection
              onSelectionChange={(platforms) =>
                setFormData(prev => ({ ...prev, platforms }))
              }
            />
          </div>

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isUploading || !formData.file || !formData.title}
          >
            {isUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
