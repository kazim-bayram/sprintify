"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Target, Ban } from "lucide-react";
import { DailyTimer } from "./daily-timer";

type Story = {
  id: string;
  number: number;
  title: string;
  storyPoints: number | null;
  updatedAt: Date;
  assignee: { id: string; name: string | null; avatarUrl: string | null } | null;
  column: { id: string; name: string; colType: string } | null;
  labels: { label: { id: string; name: string; color: string } }[];
};

type Sprint = {
  id: string;
  name: string;
  goal: string | null;
  stories: Story[];
};

interface DailyViewProps {
  projectId: string;
  projectKey: string;
  methodology: string;
}

const BLOCKED_LABEL_NAMES = ["blocked", "blocker", "impediment"];

function isBlocked(story: Story): boolean {
  return story.labels.some((sl) =>
    BLOCKED_LABEL_NAMES.includes(sl.label.name.toLowerCase())
  );
}

function isDoneYesterday(story: Story): boolean {
  const col = story.column;
  if (!col || col.colType !== "DONE") return false;
  const updated = new Date(story.updatedAt).getTime();
  const cutoff = Date.now() - 48 * 60 * 60 * 1000; // 48 hours ago
  return updated >= cutoff;
}

function isFocusToday(story: Story): boolean {
  const col = story.column;
  if (!col) return false;
  return col.colType === "TODO" || col.colType === "DOING";
}

export function DailyView({ projectId, projectKey, methodology }: DailyViewProps) {
  const { data: sprint, isLoading } = trpc.sprint.getActiveForDaily.useQuery({
    projectId,
  });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const allowed = methodology === "AGILE" || methodology === "HYBRID";
  if (!allowed) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-muted/30">
        <p className="text-sm text-muted-foreground">
          Daily Stand-up is only available for Agile and Hybrid projects.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading daily data…</p>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30">
        <p className="text-sm font-medium text-muted-foreground">
          Start a sprint to hold a daily review.
        </p>
        <p className="text-xs text-muted-foreground">
          Create and start a sprint from the Sprints page.
        </p>
      </div>
    );
  }

  const members = useMemo(() => {
    const seen = new Set<string>();
    const list: { id: string; name: string | null; avatarUrl: string | null }[] = [];
    for (const s of (sprint as Sprint).stories) {
      if (!s.assignee || seen.has(s.assignee.id)) continue;
      seen.add(s.assignee.id);
      list.push({ id: s.assignee.id, name: s.assignee.name, avatarUrl: s.assignee.avatarUrl });
    }
    return list;
  }, [sprint]);

  const stories = (sprint as Sprint).stories;
  const filteredStories = selectedUserId
    ? stories.filter((s) => s.assignee?.id === selectedUserId)
    : stories;

  const doneYesterday = filteredStories.filter(isDoneYesterday);
  const focusToday = filteredStories.filter(isFocusToday);
  const blockers = filteredStories.filter(isBlocked);

  return (
    <div className="flex h-full flex-col">
      {/* Header: Sprint Goal + Timer */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Daily Stand-up</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {projectKey}
            </Badge>
            <span className="text-sm font-medium">{sprint.name}</span>
            {sprint.goal && (
              <span className="text-sm text-muted-foreground">
                — {sprint.goal}
              </span>
            )}
          </div>
        </div>
        <DailyTimer />
      </div>

      {/* Avatar Row */}
      <div className="border-b px-6 py-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Round Robin — Click an avatar to filter
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedUserId(null)}
            className={cn(
              "rounded-full ring-2 ring-offset-2 transition-all",
              !selectedUserId
                ? "ring-primary"
                : "ring-transparent hover:ring-muted-foreground/30"
            )}
          >
            <Avatar className="h-9 w-9 border-2 border-dashed">
              <AvatarFallback className="text-xs">All</AvatarFallback>
            </Avatar>
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedUserId(m.id)}
              className={cn(
                "rounded-full ring-2 ring-offset-2 transition-all",
                selectedUserId === m.id
                  ? "ring-primary"
                  : "ring-transparent hover:ring-muted-foreground/30"
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={m.avatarUrl ?? undefined} alt={m.name ?? undefined} />
                <AvatarFallback className="text-xs">
                  {m.name?.slice(0, 2).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </button>
          ))}
        </div>
      </div>

      {/* Stand-up Board */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Done Yesterday */}
          <div className="flex flex-col rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold">Done Yesterday</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {doneYesterday.length}
              </Badge>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {doneYesterday.length === 0 ? (
                <p className="text-xs text-muted-foreground">No completions in last 48h</p>
              ) : (
                doneYesterday.map((s) => (
                  <StoryCard key={s.id} story={s} projectKey={projectKey} isBlocker={false} />
                ))
              )}
            </div>
          </div>

          {/* Focus Today */}
          <div className="flex flex-col rounded-lg border bg-card">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold">Focus Today</span>
              <Badge variant="secondary" className="ml-auto text-xs">
                {focusToday.length}
              </Badge>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {focusToday.length === 0 ? (
                <p className="text-xs text-muted-foreground">No in-progress work</p>
              ) : (
                focusToday.map((s) => (
                  <StoryCard key={s.id} story={s} projectKey={projectKey} isBlocker={false} />
                ))
              )}
            </div>
          </div>

          {/* Blockers */}
          <div className="flex flex-col rounded-lg border-2 border-destructive/50 bg-destructive/5">
            <div className="flex items-center gap-2 border-b border-destructive/30 px-4 py-2">
              <Ban className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Blockers</span>
              <Badge variant="destructive" className="ml-auto text-xs">
                {blockers.length}
              </Badge>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {blockers.length === 0 ? (
                <p className="text-xs text-muted-foreground">No blockers</p>
              ) : (
                blockers.map((s) => (
                  <StoryCard key={s.id} story={s} projectKey={projectKey} isBlocker />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryCard({
  story,
  projectKey,
  isBlocker,
}: {
  story: Story;
  projectKey: string;
  isBlocker: boolean;
}) {
  return (
    <Card
      className={cn(
        "p-3 text-sm transition-shadow hover:shadow-sm",
        isBlocker && "border-2 border-destructive"
      )}
    >
      <div className="flex items-start gap-2">
        {isBlocker && (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        )}
        <div className="min-w-0 flex-1">
          <span className="font-mono text-xs text-muted-foreground">
            {projectKey}-{story.number}
          </span>
          <p className="font-medium truncate">{story.title}</p>
          {story.storyPoints != null && (
            <span className="text-xs text-muted-foreground">{story.storyPoints} pts</span>
          )}
        </div>
      </div>
    </Card>
  );
}
