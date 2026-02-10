"use client";

import { trpc } from "@/trpc/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function BurndownDialog({ open, onOpenChange, sprintId, sprintName }: { open: boolean; onOpenChange: (o: boolean) => void; sprintId: string; sprintName: string }) {
  const { data: sprint } = trpc.sprint.getById.useQuery({ id: sprintId }, { enabled: open });

  const snapshots = sprint?.snapshots ?? [];
  const totalPoints = sprint?.stories.reduce((s, t) => s + (t.storyPoints ?? 0), 0) ?? 0;
  const completedPoints = sprint?.stories.filter((t) => t.status === "DONE").reduce((s, t) => s + (t.storyPoints ?? 0), 0) ?? 0;
  const totalValue = sprint?.stories.reduce((s, t) => s + (t.userBusinessValue ?? 0), 0) ?? 0;
  const completedValue = sprint?.stories.filter((t) => t.status === "DONE").reduce((s, t) => s + (t.userBusinessValue ?? 0), 0) ?? 0;

  const chartData = snapshots.map((s, i) => ({
    name: `Day ${i + 1}`,
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    remaining: s.totalPoints - s.completedPoints,
    ideal: snapshots.length > 1 ? Math.round(snapshots[0].totalPoints - (snapshots[0].totalPoints / (snapshots.length - 1)) * i) : s.totalPoints - s.completedPoints,
  }));

  if (sprint?.status === "ACTIVE" && snapshots.length > 0) {
    const last = snapshots[snapshots.length - 1];
    const currentRemaining = totalPoints - completedPoints;
    const lastRemaining = last.totalPoints - last.completedPoints;
    if (currentRemaining !== lastRemaining) {
      chartData.push({ name: `Day ${snapshots.length + 1}`, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), remaining: currentRemaining, ideal: 0 });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Burndown — {sprintName}
            <Badge variant="outline" className="text-xs">{completedPoints}/{totalPoints} pts</Badge>
          </DialogTitle>
        </DialogHeader>
        {chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12 }} labelStyle={{ fontWeight: 600 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="ideal" stroke="#94a3b8" strokeDasharray="5 5" name="Ideal" dot={false} />
                <Line type="monotone" dataKey="remaining" stroke="#3b82f6" strokeWidth={2} name="Actual Remaining" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No burndown data yet. Snapshots are recorded daily when the sprint is active.</div>
        )}
        <div className="grid grid-cols-4 gap-4 pt-2">
          <div className="rounded-lg border p-3 text-center"><p className="text-2xl font-bold">{totalPoints}</p><p className="text-[10px] text-muted-foreground">Total Points</p></div>
          <div className="rounded-lg border p-3 text-center"><p className="text-2xl font-bold text-green-600">{completedPoints}</p><p className="text-[10px] text-muted-foreground">Completed</p></div>
          <div className="rounded-lg border p-3 text-center"><p className="text-2xl font-bold text-orange-500">{totalPoints - completedPoints}</p><p className="text-[10px] text-muted-foreground">Remaining</p></div>
          <div className="rounded-lg border p-3 text-center"><p className="text-2xl font-bold text-blue-600">{completedValue}/{totalValue}</p><p className="text-[10px] text-muted-foreground">Value Delivered</p></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
