"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { useSocialConnections } from "@/hooks/use-social-connections";
import { toast } from "sonner";

interface VideoUploadFormData {
  description: string;
  file: File | null;
}

export function VideoUpload() {
  const { connections } = useSocialConnections();
  const connectedPlatforms = connections.filter(c => c.connected).map(c => c.platform);
  const [formData, setFormData] = useState<VideoUploadFormData>({
    description: "",
    file: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

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
    if (!formData.file || !formData.description) {
      setError("Please provide a description and video file");
      return;
    }

    if (connectedPlatforms.length === 0) {
      setError("Please connect at least one social platform");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadSuccess(false);

    try {
      // Call platform-specific endpoints in parallel
      const platformCalls = connectedPlatforms.map((platform) => {
        const platformFd = new FormData();
        platformFd.append("file", formData.file!);
        platformFd.append("description", formData.description);

        return fetch(`/api/${platform}/upload`, {
          method: "POST",
          body: platformFd,
        }).then((res) => {
          if (!res.ok) {
            throw new Error(`${platform} upload failed`);
          }
        });
      });

      await Promise.all(platformCalls);

      toast.success("Video uploaded successfully to all platforms");
      setUploadSuccess(true);

      // Reset form
      setFormData({ description: "", file: null });
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter video description"
              rows={4}
              required
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

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          <Button
            type="submit"
            className={`w-full ${uploadSuccess ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
            disabled={isUploading || !formData.file || !formData.description}
          >
            {uploadSuccess ? "Upload Successful!" : isUploading ? "Uploading..." : "Upload Video"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
