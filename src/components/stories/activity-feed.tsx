"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowRight, Flag, Hash, MessageSquare, Tag, Paperclip, Archive, RotateCcw, UserPlus, UserMinus, Building2, BarChart3,
} from "lucide-react";

interface ActivityUser { id: string; name: string | null; email: string; avatarUrl: string | null; }
interface ActivityItem { id: string; type: string; data: unknown; createdAt: Date | string; user: ActivityUser; }

const ICONS: Record<string, React.ElementType> = {
  STATUS_CHANGE: ArrowRight, PRIORITY_CHANGE: Flag, DEPARTMENT_CHANGE: Building2,
  ASSIGNED: UserPlus, UNASSIGNED: UserMinus,
  COMMENT_ADDED: MessageSquare, COMMENT_DELETED: MessageSquare,
  LABEL_ADDED: Tag, LABEL_REMOVED: Tag,
  STORY_POINTS_CHANGED: Hash, WSJF_UPDATED: BarChart3,
  ATTACHMENT_ADDED: Paperclip, ATTACHMENT_REMOVED: Paperclip,
  STORY_ARCHIVED: Archive, STORY_RESTORED: RotateCcw,
};

function describeActivity(type: string, data: Record<string, unknown> | null): string {
  switch (type) {
    case "STATUS_CHANGE": return `moved from ${data?.from ?? "?"} to ${data?.to ?? "?"}`;
    case "PRIORITY_CHANGE": return `changed priority from ${data?.from ?? "None"} to ${data?.to ?? "None"}`;
    case "DEPARTMENT_CHANGE": return `changed department to ${data?.to ?? "None"}`;
    case "ASSIGNED": return "assigned this story";
    case "UNASSIGNED": return "unassigned this story";
    case "COMMENT_ADDED": return "added a comment";
    case "COMMENT_DELETED": return "deleted a comment";
    case "LABEL_ADDED": return `added label "${data?.labelName ?? "?"}"`;
    case "LABEL_REMOVED": return `removed label "${data?.labelName ?? "?"}"`;
    case "STORY_POINTS_CHANGED": return `changed story points`;
    case "WSJF_UPDATED": return "updated WSJF scoring";
    case "ATTACHMENT_ADDED": return `attached "${data?.fileName ?? "a file"}"`;
    case "ATTACHMENT_REMOVED": return `removed "${data?.fileName ?? "a file"}"`;
    case "STORY_ARCHIVED": return "archived this story";
    case "STORY_RESTORED": return "restored this story";
    default: return type.toLowerCase().replace(/_/g, " ");
  }
}

function timeAgo(date: Date | string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) return <p className="text-center text-xs text-muted-foreground py-4">No activity yet</p>;

  return (
    <div className="space-y-3">
      {activities.map((a) => {
        const Icon = ICONS[a.type] ?? ArrowRight;
        const data = (a.data ?? {}) as Record<string, unknown>;
        return (
          <div key={a.id} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs">
                <span className="font-medium">{a.user.name ?? a.user.email}</span>{" "}
                <span className="text-muted-foreground">{describeActivity(a.type, data)}</span>
              </p>
              <span className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
