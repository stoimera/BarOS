"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Facebook, Instagram } from "lucide-react";
import { toast } from "sonner";

interface PublicSocialPost {
  id: string;
  platform: "facebook" | "instagram" | "tiktok";
  content: string;
  posted_at: string | null;
}

export default function SocialsPage() {
  const [posts, setPosts] = useState<PublicSocialPost[]>([]);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const response = await fetch("/api/socials/posts?limit=10");
        const payload = (await response.json()) as {
          error?: string;
          posts?: PublicSocialPost[];
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load social posts.");
        }
        setPosts(payload.posts ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load social posts.");
      }
    };

    void loadPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Socials</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Follow Urban Lounge on social channels.
            </p>
          </div>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Follow us</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => window.open("https://instagram.com/yourbar", "_blank")}
              >
                <span className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" /> Instagram
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => window.open("https://facebook.com/yourbar", "_blank")}
              >
                <span className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" /> Facebook
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => window.open("https://tiktok.com/@yourbar", "_blank")}
              >
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  TikTok
                </span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Recent posts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {posts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No published posts yet.</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="rounded-md border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{post.platform}</span>
                      <span className="text-xs text-muted-foreground">
                        {post.posted_at ? new Date(post.posted_at).toLocaleString() : "pending"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{post.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
