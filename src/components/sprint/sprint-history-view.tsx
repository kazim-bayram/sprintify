"use client";

import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays, Target } from "lucide-react";

export function SprintHistoryView({ projectId, projectKey }: { projectId: string; projectKey: string }) {
  const { data: closedSprints, isLoading } = trpc.sprint.history.useQuery({ projectId });

  const recentClosed = closedSprints?.slice(0, 3) ?? [];
  const velocities = recentClosed.map((s) => s.snapshots[0]?.completedPoints ?? 0);
  const avgVelocity = velocities.length > 0 ? Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length) : 0;

  // Value delivered tracking
  const valueDelivered = recentClosed.map((s) => s.snapshots[0]?.completedValue ?? 0);
  const avgValue = valueDelivered.length > 0 ? Math.round(valueDelivered.reduce((a, b) => a + b, 0) / valueDelivered.length) : 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="font-mono">{projectKey}</Badge>
            <h1 className="text-2xl font-bold tracking-tight">Sprint History</h1>
          </div>
          <p className="text-sm text-muted-foreground">Past sprints, velocity, and value delivered.</p>
        </div>
        <div className="flex gap-3">
          <Card className="px-5 py-3 text-center">
            <p className="text-2xl font-bold text-primary">{avgVelocity}</p>
            <p className="text-[10px] text-muted-foreground">Avg. Velocity (pts)</p>
          </Card>
          <Card className="px-5 py-3 text-center">
            <p className="text-2xl font-bold text-green-600">{avgValue}</p>
            <p className="text-[10px] text-muted-foreground">Avg. Value Delivered</p>
          </Card>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading sprint history...</p>
      ) : closedSprints && closedSprints.length > 0 ? (
        <div className="space-y-3">
          {closedSprints.map((sprint) => {
            const snap = sprint.snapshots[0];
            const total = snap?.totalPoints ?? 0;
            const completed = snap?.completedPoints ?? 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const valTotal = snap?.totalValue ?? 0;
            const valCompleted = snap?.completedValue ?? 0;
            return (
              <Card key={sprint.id} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{sprint.name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{sprint.startDate ? new Date(sprint.startDate).toLocaleDateString() : "—"} → {sprint.endDate ? new Date(sprint.endDate).toLocaleDateString() : "—"}</span>
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" />{sprint._count.stories} stories</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-center">
                  <div><p className="text-lg font-bold text-green-600">{completed}</p><p className="text-[10px] text-muted-foreground">Completed</p></div>
                  <div><p className="text-lg font-bold">{total}</p><p className="text-[10px] text-muted-foreground">Total pts</p></div>
                  <div><p className="text-lg font-bold text-blue-600">{valCompleted}</p><p className="text-[10px] text-muted-foreground">Value</p></div>
                  <Badge variant={pct >= 80 ? "default" : pct >= 50 ? "secondary" : "destructive"} className="text-xs">{pct}%</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No completed sprints yet.</div>
      )}
    </div>
  );
}
