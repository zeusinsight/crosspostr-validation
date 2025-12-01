"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface FacebookPage {
  id: string;
  name: string;
  picture?: { data?: { url?: string } };
}

interface FacebookPageSelectorProps {
  onPageSelected: () => void;
  onClose: () => void;
}

export function FacebookPageSelector({ onPageSelected, onClose }: FacebookPageSelectorProps) {
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch("/api/auth/facebook/pages");
        if (!res.ok) {
          throw new Error("Failed to fetch pages");
        }
        const data = await res.json();
        setPages(data.pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, []);

  const handlePageSelect = async (page: FacebookPage) => {
    try {
      const res = await fetch("/api/auth/facebook/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId: page.id,
          context: "destination",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to select page");
      }

      onPageSelected();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Select Facebook Page</CardTitle>
          <CardDescription>
            Choose which Facebook page to connect for posting
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading pages...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : (
            <div className="space-y-3">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePageSelect(page)}
                >
                  {page.picture?.data?.url && (
                    <Image
                      src={page.picture.data.url}
                      alt={page.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium">{page.name}</h3>
                  </div>
                  <Button size="sm" variant="outline">
                    Select
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
