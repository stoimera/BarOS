"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Link as LinkIcon,
  ListChecks,
  Pencil,
  Send,
  Timer,
  Trash2,
  Unplug,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

type Platform = "facebook" | "instagram" | "tiktok";

interface PublishResult {
  platform: Platform;
  success: boolean;
  error?: string;
}

interface PlatformConnection {
  platform: Platform;
  connected: boolean;
  updatedAt: string;
  hasAccessToken: boolean;
  hasPageId: boolean;
  hasAccountId: boolean;
  hasWebhookUrl: boolean;
}

interface ConnectionDraft {
  accessToken: string;
  pageId: string;
  accountId: string;
  webhookUrl: string;
}

const PLATFORM_OPTIONS: { id: Platform; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
];

interface SocialsManagerProps {
  title?: string;
  subtitle?: string;
  canManage?: boolean;
}

interface PostItem {
  id: string;
  platform: Platform;
  content: string;
  status: string;
  posted_at?: string | null;
  scheduled_at?: string | null;
}

type ViewMode = "month" | "week";

const PLATFORM_ACCENTS: Record<Platform, string> = {
  facebook: "border-l-blue-600",
  instagram: "border-l-pink-600",
  tiktok: "border-l-cyan-500",
};

const PLATFORM_BADGE: Record<Platform, string> = {
  facebook: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  instagram: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200",
  tiktok: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
};

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function SocialsManager({
  title = "Socials",
  subtitle = "Publish and schedule content to connected channels.",
  canManage = true,
}: SocialsManagerProps) {
  const searchParams = useSearchParams();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>(["facebook", "instagram", "tiktok"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<PublishResult[]>([]);
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [drafts, setDrafts] = useState<Record<Platform, ConnectionDraft>>({
    facebook: { accessToken: "", pageId: "", accountId: "", webhookUrl: "" },
    instagram: { accessToken: "", pageId: "", accountId: "", webhookUrl: "" },
    tiktok: { accessToken: "", pageId: "", accountId: "", webhookUrl: "" },
  });
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<Platform | null>(null);
  const [oauthPlatform, setOauthPlatform] = useState<Platform | null>(null);
  const [recentPosts, setRecentPosts] = useState<PostItem[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<PostItem[]>([]);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedScheduledIds, setSelectedScheduledIds] = useState<string[]>([]);
  const [bulkRescheduleValue, setBulkRescheduleValue] = useState("");
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const isScheduleMode = useMemo(() => Boolean(scheduledAt), [scheduledAt]);

  const connectedPlatforms = useMemo(
    () => new Set(connections.filter((item) => item.connected).map((item) => item.platform)),
    [connections]
  );

  const togglePlatform = (platform: Platform, checked: boolean): void => {
    setPlatforms((current) => {
      if (checked) {
        return current.includes(platform) ? current : [...current, platform];
      }
      return current.filter((item) => item !== platform);
    });
  };

  const loadConnections = useCallback(async (): Promise<void> => {
    if (!canManage) return;
    setLoadingConnections(true);
    try {
      const response = await fetch("/api/socials/connections", { method: "GET" });
      const payload = (await response.json()) as {
        error?: string;
        connections?: PlatformConnection[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load social connections.");
      }

      setConnections(payload.connections ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load social connections.");
    } finally {
      setLoadingConnections(false);
    }
  }, [canManage]);

  const loadRecentPosts = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/socials/posts?limit=12");
      const payload = (await response.json()) as {
        error?: string;
        posts?: PostItem[];
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load posts.");
      }
      setRecentPosts(payload.posts ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load social posts.");
    }
  }, []);

  const loadScheduledPosts = useCallback(
    async (): Promise<void> => {
      if (!canManage) {
        setScheduledPosts([]);
        return;
      }
      try {
        const response = await fetch("/api/socials/posts?mode=scheduled&limit=500");
        const payload = (await response.json()) as { error?: string; posts?: PostItem[] };
        if (!response.ok) {
          throw new Error(payload.error ?? "Failed to load scheduled posts.");
        }
        setScheduledPosts(payload.posts ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load scheduled posts.");
      }
    },
    [canManage]
  );

  useEffect(() => {
    void loadConnections();
    void loadRecentPosts();
    void loadScheduledPosts();
  }, [loadConnections, loadRecentPosts, loadScheduledPosts]);

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    const platform = searchParams.get("platform");
    const reason = searchParams.get("reason");

    if (oauth === "connected") {
      toast.success(`${platform ?? "Platform"} connected via OAuth.`);
      void loadConnections();
      return;
    }

    if (oauth === "error") {
      toast.error(reason ?? "OAuth connection failed.");
    }
  }, [searchParams, loadConnections]);

  const updateDraft = (platform: Platform, field: keyof ConnectionDraft, value: string): void => {
    setDrafts((current) => ({
      ...current,
      [platform]: {
        ...current[platform],
        [field]: value,
      },
    }));
  };

  const connectPlatform = async (platform: Platform): Promise<void> => {
    const draft = drafts[platform];
    setConnectingPlatform(platform);
    try {
      const response = await fetch("/api/socials/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          accessToken: draft.accessToken || undefined,
          pageId: draft.pageId || undefined,
          accountId: draft.accountId || undefined,
          webhookUrl: draft.webhookUrl || undefined,
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to connect platform.");
      }

      toast.success(`${platform} connected.`);
      await loadConnections();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect platform.");
    } finally {
      setConnectingPlatform(null);
    }
  };

  const disconnectPlatform = async (platform: Platform): Promise<void> => {
    setDisconnectingPlatform(platform);
    try {
      const response = await fetch(`/api/socials/connections?platform=${platform}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to disconnect platform.");
      }

      toast.success(`${platform} disconnected.`);
      await loadConnections();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disconnect platform.");
    } finally {
      setDisconnectingPlatform(null);
    }
  };

  const startOAuth = async (platform: Platform): Promise<void> => {
    setOauthPlatform(platform);
    try {
      const response = await fetch(`/api/socials/oauth/start?platform=${platform}`);
      const payload = (await response.json()) as { error?: string; authorizeUrl?: string };
      if (!response.ok || !payload.authorizeUrl) {
        throw new Error(payload.error ?? "Failed to start OAuth flow.");
      }
      window.open(payload.authorizeUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start OAuth flow.");
    } finally {
      setOauthPlatform(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!content.trim()) {
      toast.error("Post content is required.");
      return;
    }

    if (platforms.length === 0) {
      toast.error("Select at least one platform.");
      return;
    }
    if (!canManage) {
      toast.error("Only admins can publish content.");
      return;
    }

    const missingConnection = platforms.find((platform) => !connectedPlatforms.has(platform));
    if (missingConnection) {
      toast.error(`Connect ${missingConnection} before publishing.`);
      return;
    }

    setIsSubmitting(true);
    setResults([]);

    try {
      const response = await fetch("/api/socials/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined,
          scheduledAt: scheduledAt || undefined,
          platforms,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        mode?: "immediate" | "scheduled";
        results?: PublishResult[];
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to publish post.");
      }

      if (payload.mode === "scheduled") {
        toast.success("Posts scheduled successfully.");
        setResults(
          platforms.map((platform) => ({
            platform,
            success: true,
          }))
        );
      } else {
        setResults(payload.results ?? []);
        const failed = payload.results?.some((result) => !result.success);
        if (failed) {
          toast.error("Some channels failed. Review the status below.");
        } else {
          toast.success("Post published successfully.");
        }
      }
      await loadRecentPosts();
      await loadScheduledPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMonth = (delta: number): void => {
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + delta, 1);
    setCalendarMonth(next);
  };

  const daysInMonth = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [calendarMonth]);

  const firstDayOffset = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
    return firstDay;
  }, [calendarMonth]);

  const dayBuckets = useMemo(() => {
    const buckets = new Map<string, typeof scheduledPosts>();
    for (const post of scheduledPosts) {
      if (!post.scheduled_at) continue;
      const date = new Date(post.scheduled_at);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const current = buckets.get(key) ?? [];
      current.push(post);
      buckets.set(key, current);
    }
    return buckets;
  }, [scheduledPosts]);

  const visibleDates = useMemo(() => {
    if (viewMode === "week") {
      const weekStart = new Date(selectedDay);
      weekStart.setDate(selectedDay.getDate() - selectedDay.getDay());
      return Array.from({ length: 7 }).map((_, index) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + index);
        return d;
      });
    }

    const dates: Array<Date | null> = [];
    for (let i = 0; i < firstDayOffset; i += 1) {
      dates.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      dates.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
    }
    return dates;
  }, [calendarMonth, daysInMonth, firstDayOffset, selectedDay, viewMode]);

  const selectedDayPosts = useMemo(() => {
    const key = dayKey(selectedDay);
    return dayBuckets.get(key) ?? [];
  }, [dayBuckets, selectedDay]);

  const selectedDayIds = useMemo(() => selectedDayPosts.map((post) => post.id), [selectedDayPosts]);

  const startReschedule = (id: string, scheduledAt: string | null): void => {
    setRescheduleId(id);
    setRescheduleValue(toDateTimeLocalValue(scheduledAt));
  };

  const submitReschedule = async (): Promise<void> => {
    if (!rescheduleId || !rescheduleValue) return;
    try {
      const response = await fetch(`/api/socials/posts/${rescheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: rescheduleValue }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to reschedule post.");
      }
      toast.success("Scheduled post updated.");
      setRescheduleId(null);
      setRescheduleValue("");
      await loadScheduledPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reschedule post.");
    }
  };

  const deleteScheduledPost = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/socials/posts/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to delete scheduled post.");
      }
      toast.success("Scheduled post deleted.");
      await loadScheduledPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete scheduled post.");
    }
  };

  const toggleScheduledSelection = (postId: string, checked: boolean): void => {
    setSelectedScheduledIds((current) =>
      checked ? [...new Set([...current, postId])] : current.filter((id) => id !== postId)
    );
  };

  const selectAllForSelectedDay = (): void => {
    setSelectedScheduledIds((current) => [...new Set([...current, ...selectedDayIds])]);
  };

  const clearSelections = (): void => {
    setSelectedScheduledIds([]);
  };

  const runBulkAction = async (action: "publish_now" | "delete" | "reschedule"): Promise<void> => {
    if (selectedScheduledIds.length === 0) {
      toast.error("Select at least one scheduled post.");
      return;
    }
    if (action === "reschedule" && !bulkRescheduleValue) {
      toast.error("Select a datetime for bulk reschedule.");
      return;
    }

    setIsBulkProcessing(true);
    try {
      const response = await fetch("/api/socials/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ids: selectedScheduledIds,
          scheduledAt: action === "reschedule" ? bulkRescheduleValue : undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Bulk action failed.");
      }
      toast.success("Bulk queue action completed.");
      setSelectedScheduledIds([]);
      setBulkRescheduleValue("");
      await loadScheduledPosts();
      await loadRecentPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk queue action failed.");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const moveScheduledPostToDay = async (postId: string, targetDate: Date): Promise<void> => {
    const post = scheduledPosts.find((item) => item.id === postId);
    if (!post?.scheduled_at) return;

    const original = new Date(post.scheduled_at);
    const moved = new Date(targetDate);
    moved.setHours(original.getHours(), original.getMinutes(), 0, 0);

    try {
      const response = await fetch(`/api/socials/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: moved.toISOString() }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to move scheduled post.");
      }
      toast.success("Post moved by drag-and-drop.");
      await loadScheduledPosts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to move scheduled post.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">{subtitle}</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <LinkIcon className="h-5 w-5" />
            Platform Connections (Admin OAuth Credentials)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage && (
            <p className="text-sm text-muted-foreground">
              Connection management and publishing are restricted to admin accounts.
            </p>
          )}
          {PLATFORM_OPTIONS.map((platform) => {
            const connection = connections.find((item) => item.platform === platform.id);
            const isConnected = Boolean(connection?.connected);
            return (
              <div
                key={platform.id}
                className="rounded-lg border border-border bg-background p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{platform.label}</span>
                    <Badge variant={isConnected ? "default" : "secondary"}>
                      {isConnected ? "connected" : "not connected"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => startOAuth(platform.id)}
                      disabled={oauthPlatform === platform.id || !canManage}
                    >
                      {oauthPlatform === platform.id ? "Starting OAuth..." : "Start OAuth"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => connectPlatform(platform.id)}
                      disabled={connectingPlatform === platform.id || !canManage}
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      {connectingPlatform === platform.id ? "Saving..." : "Connect"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => disconnectPlatform(platform.id)}
                      disabled={!isConnected || disconnectingPlatform === platform.id || !canManage}
                    >
                      <Unplug className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>

                {platform.id !== "tiktok" && (
                  <div className="space-y-2">
                    <Label>{platform.label} access token</Label>
                    <Input
                      type="password"
                      value={drafts[platform.id].accessToken}
                      onChange={(event) =>
                        updateDraft(platform.id, "accessToken", event.target.value)
                      }
                      placeholder="Paste OAuth access token"
                      disabled={!canManage}
                    />
                  </div>
                )}

                {platform.id === "facebook" && (
                  <div className="space-y-2">
                    <Label>Facebook page ID</Label>
                    <Input
                      value={drafts.facebook.pageId}
                      onChange={(event) =>
                        updateDraft("facebook", "pageId", event.target.value)
                      }
                      placeholder="Page ID"
                      disabled={!canManage}
                    />
                  </div>
                )}

                {platform.id === "instagram" && (
                  <div className="space-y-2">
                    <Label>Instagram business account ID</Label>
                    <Input
                      value={drafts.instagram.accountId}
                      onChange={(event) =>
                        updateDraft("instagram", "accountId", event.target.value)
                      }
                      placeholder="Business account ID"
                      disabled={!canManage}
                    />
                  </div>
                )}

                {platform.id === "tiktok" && (
                  <div className="space-y-2">
                    <Label>TikTok publish webhook URL</Label>
                    <Input
                      type="url"
                      value={drafts.tiktok.webhookUrl}
                      onChange={(event) =>
                        updateDraft("tiktok", "webhookUrl", event.target.value)
                      }
                      placeholder="https://your-worker/publish"
                      disabled={!canManage}
                    />
                  </div>
                )}
              </div>
            );
          })}
          {loadingConnections && (
            <p className="text-sm text-muted-foreground">Loading connections...</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Globe2 className="h-5 w-5" />
            Social Publisher
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="post-content">Post content</Label>
              <Textarea
                id="post-content"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Write your campaign caption, announcement, or promo..."
                className="min-h-28"
                maxLength={2200}
                required
              />
              <p className="text-xs text-muted-foreground">{content.length}/2200 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL (required for Instagram)</Label>
              <Input
                id="image-url"
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled-at">Schedule time (optional)</Label>
              <Input
                id="scheduled-at"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to publish immediately.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Platforms</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PLATFORM_OPTIONS.map((platform) => (
                  <label
                    key={platform.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
                  >
                    <Checkbox
                      checked={platforms.includes(platform.id)}
                      onCheckedChange={(checked) =>
                        togglePlatform(platform.id, checked === true)
                      }
                      aria-label={`Select ${platform.label}`}
                    />
                    <span className="text-sm text-foreground">{platform.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || !canManage} className="w-full sm:w-auto">
              {isSubmitting ? (
                <>
                  <Send className="h-4 w-4 mr-2 animate-pulse" />
                  Processing...
                </>
              ) : isScheduleMode ? (
                <>
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Schedule Post
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish Now
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Published Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No published posts yet.</p>
          ) : (
            recentPosts.map((post) => (
              <div
                key={post.id}
                className={`rounded-md border border-border border-l-4 px-3 py-2 space-y-1 ${
                  PLATFORM_ACCENTS[post.platform]
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge className={PLATFORM_BADGE[post.platform]}>{post.platform}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {post.posted_at ? new Date(post.posted_at).toLocaleString() : "pending"}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-foreground">
            <span>Scheduled Posting Calendar</span>
            <span className="text-sm font-normal text-muted-foreground">
              {calendarMonth.toLocaleString(undefined, { month: "long", year: "numeric" })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canManage ? (
            <p className="text-sm text-muted-foreground">
              Calendar management is available for admins only.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="icon" variant="outline" onClick={() => changeMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="outline" onClick={() => changeMonth(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "month" ? "default" : "outline"}
                  onClick={() => setViewMode("month")}
                >
                  Month View
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={viewMode === "week" ? "default" : "outline"}
                  onClick={() => setViewMode("week")}
                >
                  Week View
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) => (
                  <div key={name} className="text-center font-medium">
                    {name}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {visibleDates.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} />;
                  }
                  const day = date.getDate();
                  const key = dayKey(date);
                  const count = dayBuckets.get(key)?.length ?? 0;
                  const isSelected =
                    selectedDay.getFullYear() === date.getFullYear() &&
                    selectedDay.getMonth() === date.getMonth() &&
                    selectedDay.getDate() === date.getDate();
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(date)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        const postId = event.dataTransfer.getData("text/plain");
                        if (postId) {
                          void moveScheduledPostToDay(postId, date);
                        }
                        setDraggingPostId(null);
                      }}
                      className={`rounded-md border p-2 text-left min-h-16 ${
                        isSelected ? "border-primary bg-primary/10" : "border-border bg-background"
                      }`}
                    >
                      <div className="text-sm text-foreground">{day}</div>
                      {count > 0 && (
                        <div className="mt-1 flex gap-1 flex-wrap">
                          <Badge variant="secondary">{count}</Badge>
                          {(["facebook", "instagram", "tiktok"] as Platform[]).map((platform) => {
                            const platformCount =
                              dayBuckets.get(key)?.filter((post) => post.platform === platform).length ?? 0;
                            if (platformCount === 0) return null;
                            return (
                              <span
                                key={`${key}-${platform}`}
                                className={`h-2 w-2 rounded-full ${
                                  platform === "facebook"
                                    ? "bg-blue-500"
                                    : platform === "instagram"
                                    ? "bg-pink-500"
                                    : "bg-cyan-500"
                                }`}
                                title={`${platform}: ${platformCount}`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <h4 className="text-sm font-medium text-foreground">
                    Scheduled on {selectedDay.toLocaleDateString()}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={selectAllForSelectedDay}>
                      Select Day
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={clearSelections}>
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <ListChecks className="h-4 w-4" />
                    Bulk Queue Actions ({selectedScheduledIds.length} selected)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      disabled={isBulkProcessing}
                      onClick={() => void runBulkAction("publish_now")}
                    >
                      Publish Now
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={isBulkProcessing}
                      onClick={() => void runBulkAction("delete")}
                    >
                      Delete Selected
                    </Button>
                    <Input
                      type="datetime-local"
                      value={bulkRescheduleValue}
                      onChange={(event) => setBulkRescheduleValue(event.target.value)}
                      className="w-full sm:w-56"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isBulkProcessing}
                      onClick={() => void runBulkAction("reschedule")}
                    >
                      Reschedule Selected
                    </Button>
                  </div>
                </div>

                {selectedDayPosts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No posts for this day.</p>
                ) : (
                  selectedDayPosts.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", post.id);
                        setDraggingPostId(post.id);
                      }}
                      onDragEnd={() => setDraggingPostId(null)}
                      className={`rounded-md border border-border border-l-4 p-3 space-y-2 cursor-move ${
                        PLATFORM_ACCENTS[post.platform]
                      } ${draggingPostId === post.id ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedScheduledIds.includes(post.id)}
                            onCheckedChange={(checked) =>
                              toggleScheduledSelection(post.id, checked === true)
                            }
                            aria-label={`Select scheduled post ${post.id}`}
                          />
                          <Badge className={PLATFORM_BADGE[post.platform]}>{post.platform}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {post.scheduled_at ? new Date(post.scheduled_at).toLocaleString() : "N/A"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-3">{post.content}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startReschedule(post.id, post.scheduled_at ?? null)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Reschedule
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => void deleteScheduledPost(post.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                      {rescheduleId === post.id && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="datetime-local"
                            value={rescheduleValue}
                            onChange={(event) => setRescheduleValue(event.target.value)}
                          />
                          <Button type="button" onClick={() => void submitReschedule()}>
                            Save
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Posting Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Run a publish action to see per-platform delivery results.
            </p>
          ) : (
            results.map((result) => (
              <div
                key={result.platform}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Timer className="h-4 w-4 text-destructive" />
                  )}
                  <span className="capitalize text-sm text-foreground">{result.platform}</span>
                </div>
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "success" : result.error ?? "failed"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
