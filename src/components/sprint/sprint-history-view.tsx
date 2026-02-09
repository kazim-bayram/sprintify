"use client";

import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays, CheckCircle2, Target } from "lucide-react";

interface SprintHistoryViewProps {
  projectId: string;
  projectKey: string;
}

export function SprintHistoryView({ projectId, projectKey }: SprintHistoryViewProps) {
  const { data: closedSprints, isLoading } = trpc.sprint.history.useQuery({ projectId });
  const { data: allSprints } = trpc.sprint.list.useQuery({ projectId });

  // Compute velocity: average completed points across last 3 closed sprints
  const recentClosed = closedSprints?.slice(0, 3) ?? [];
  const velocities = recentClosed.map((s) => {
    const lastSnapshot = s.snapshots[0]; // most recent snapshot (desc order, take 1)
    return lastSnapshot?.completedPoints ?? 0;
  });
  const avgVelocity =
    velocities.length > 0
      ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length)
      : 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono">{projectKey}</Badge>
            <h1 className="text-2xl font-bold tracking-tight">Sprint History</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Past sprints and velocity tracking.
          </p>
        </div>

        {/* Velocity card */}
        <Card className="px-5 py-3 text-center">
          <p className="text-2xl font-bold text-primary">{avgVelocity}</p>
          <p className="text-[10px] text-muted-foreground">
            Avg. Velocity (last {recentClosed.length} sprint{recentClosed.length !== 1 ? "s" : ""})
          </p>
        </Card>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading sprint history...</p>
      ) : closedSprints && closedSprints.length > 0 ? (
        <div className="space-y-3">
          {closedSprints.map((sprint) => {
            const lastSnapshot = sprint.snapshots[0];
            const total = lastSnapshot?.totalPoints ?? 0;
            const completed = lastSnapshot?.completedPoints ?? 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Card key={sprint.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{sprint.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {sprint.startDate
                        ? new Date(sprint.startDate).toLocaleDateString()
                        : "—"}{" "}
                      →{" "}
                      {sprint.endDate
                        ? new Date(sprint.endDate).toLocaleDateString()
                        : "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {sprint._count.tickets} tickets
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600">{completed}</p>
                    <p className="text-[10px] text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{total}</p>
                    <p className="text-[10px] text-muted-foreground">Total pts</p>
                  </div>
                  <Badge
                    variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "destructive"}
                    className="text-xs"
                  >
                    {pct}%
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
          No completed sprints yet.
        </div>
      )}
    </div>
  );
}
