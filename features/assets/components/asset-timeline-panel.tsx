"use client";

import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import {
  ArrowRight,
  MessageSquare,
  Plus,
  Send,
  UserCheck,
  Wrench,
  Tag,
  Clock,
} from "lucide-react";
import { Asset, AssetActivity } from "@/lib/types";
import { formatDisplayDate, formatShortDate, formatTimestamp } from "@/lib/date-utils";
import { PersonAvatar } from "@/components/shared/person-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AssetStatusBadge } from "./asset-status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useAssets } from "@/context/assets-context";
import { useAuth } from "@/context/auth-context";

interface AssetTimelinePanelProps {
  asset: Asset;
}

export function AssetTimelinePanel({ asset }: AssetTimelinePanelProps) {
  const { people, showToast } = useAssets();
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<AssetActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await fetch(`/api/activity?asset_id=${asset.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setActivities(data.activity || []);
      }
    } catch (err) {
      console.error("Failed to load activity", err);
    } finally {
      setLoading(false);
    }
  }, [asset.id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setIsPosting(true);
      const res = await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: asset.id, body: commentText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post comment");
      }
      setCommentText("");
      showToast("Comment recorded in timeline");
      await fetchActivities();
    } catch (err: any) {
      showToast(err.message || "Failed to post comment");
    } finally {
      setIsPosting(false);
    }
  };

  const personName = (email: string) =>
    people.find((p) => p.email.toLowerCase() === email.toLowerCase())?.name || email;

  // Group events by day
  const grouped: Record<string, AssetActivity[]> = {};
  activities.forEach((entry) => {
    const day = entry.at ? entry.at.slice(0, 10) : "Earlier";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(entry);
  });

  const getDayHeading = (dateStr: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
    if (dateStr === today) return "Today";
    if (dateStr === yesterday) return "Yesterday";
    return formatDisplayDate(dateStr);
  };

  const renderEventDetails = (entry: AssetActivity) => {
    if (entry.kind === "comment") {
      return (
        <div className="mt-1 rounded-md border bg-muted/60 p-2.5 text-sm leading-relaxed text-foreground">
          {entry.body}
        </div>
      );
    }

    if (entry.kind === "created") {
      return (
        <p className="text-xs text-muted-foreground mt-0.5">
          Registered into system as <AssetStatusBadge status={entry.to_value || "Available"} className="inline-flex" />
        </p>
      );
    }

    if (entry.kind === "status") {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
          <span>Status changed:</span>
          {entry.from_value && <AssetStatusBadge status={entry.from_value} />}
          <ArrowRight className="size-3 text-muted-foreground shrink-0" />
          <AssetStatusBadge status={entry.to_value} />
        </div>
      );
    }

    if (entry.kind === "custody") {
      return (
        <div className="text-xs mt-0.5 space-y-1">
          <div className="flex items-center gap-1.5 text-foreground flex-wrap">
            <span className="text-muted-foreground">Custody:</span>
            <span className="max-w-full truncate rounded bg-muted px-1.5 py-0.5 text-xs font-medium" title={entry.from_value || "None"}>
              {entry.from_value || "None"}
            </span>
            <ArrowRight className="size-3 text-muted-foreground shrink-0" />
            <span className="max-w-full truncate rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary" title={entry.to_value}>
              {entry.to_value}
            </span>
          </div>
          {entry.body && <p className="text-xs break-words text-muted-foreground">{entry.body}</p>}
        </div>
      );
    }

    if (entry.kind === "maintenance") {
      return (
        <div className="text-xs text-foreground mt-0.5">
          <p className="font-medium">{entry.body}</p>
        </div>
      );
    }

    return <p className="text-xs text-muted-foreground mt-0.5">{entry.body}</p>;
  };

  const getEventIcon = (kind: string) => {
    switch (kind) {
      case "created":
        return <Plus className="size-3 text-success" />;
      case "status":
        return <Tag className="size-3 text-info" />;
      case "custody":
        return <UserCheck className="size-3 text-primary" />;
      case "maintenance":
        return <Wrench className="size-3 text-warning" />;
      default:
        return <MessageSquare className="size-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Add Comment Form */}
      <form onSubmit={handlePostComment} className="space-y-2 border-b pb-4">
        <Textarea
          placeholder="Log notes, condition change, or asset audit remarks..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={2}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={isPosting || !commentText.trim()}
            className="gap-1.5"
          >
            <Send className="size-3" />
            {isPosting ? "Posting..." : "Log Note"}
          </Button>
        </div>
      </form>

      {/* Timeline Stream */}
      {loading ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          Loading asset timeline...
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<Clock className="size-4" />}
          title="No history logged yet"
          description="Timeline events, custody handovers, condition changes, and notes will appear here."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, entries]) => (
            <div key={dateKey} className="space-y-3">
              <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-xs py-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {getDayHeading(dateKey)}
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                {entries.map((entry) => (
                  <div key={entry.id} className="relative group">
                    <span className="absolute -left-6 top-0.5 size-5 rounded-full border bg-background flex items-center justify-center">
                      {getEventIcon(entry.kind)}
                    </span>

                    <div className="flex min-w-0 items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-foreground" title={entry.actor_email}>
                          {personName(entry.actor_email)}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {entry.at ? entry.at.slice(11, 16) : ""}
                        </span>
                      </div>
                    </div>

                    {renderEventDetails(entry)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

