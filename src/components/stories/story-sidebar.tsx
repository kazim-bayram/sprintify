"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PRIORITIES, STORY_POINTS, STORY_STATUSES, DEPARTMENTS, WSJF_SCALE, calculateWSJF } from "@/lib/constants";
import { User, Flag, Hash, Circle, Building2, BarChart3 } from "lucide-react";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type StoryDetail = RouterOutputs["story"]["getById"];

export function StorySidebar({ story }: { story: StoryDetail }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const members = trpc.member.list.useQuery();
  const features = trpc.feature.list.useQuery({ projectId: story.projectId });

  const updateMutation = trpc.story.update.useMutation({
    onSuccess: () => { utils.story.getById.invalidate({ id: story.id }); router.refresh(); },
    onError: (err) => toast.error(err.message),
  });

  function update(data: Record<string, unknown>) {
    updateMutation.mutate({ id: story.id, ...data });
  }

  const wsjf = calculateWSJF(story.userBusinessValue, story.timeCriticality, story.riskReduction, story.jobSize);

  return (
    <div className="space-y-3 text-sm">
      {/* WSJF Score Highlight */}
      {wsjf > 0 && (
        <div className="flex items-center gap-2 rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">WSJF Score</span>
          <span className="ml-auto text-lg font-bold text-primary">{wsjf}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {/* Status */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Circle className="h-3 w-3" /> Status</label>
          <Select value={story.status} onValueChange={(v) => update({ status: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STORY_STATUSES.map((s) => <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Priority */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Flag className="h-3 w-3" /> Priority</label>
          <Select value={story.priority} onValueChange={(v) => update({ priority: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Department */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3 w-3" /> Department</label>
          <Select value={story.department ?? "none"} onValueChange={(v) => update({ department: v === "none" ? null : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Owner */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3 w-3" /> Owner</label>
          <Select value={story.assigneeId ?? "unassigned"} onValueChange={(v) => update({ assigneeId: v === "unassigned" ? null : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Unassigned" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned" className="text-xs">Unassigned</SelectItem>
              {members.data?.map((m) => (
                <SelectItem key={m.user.id} value={m.user.id} className="text-xs">
                  <span className="flex items-center gap-2">
                    <Avatar className="h-4 w-4"><AvatarImage src={m.user.avatarUrl ?? undefined} /><AvatarFallback className="text-[8px]">{m.user.name?.charAt(0) ?? m.user.email.charAt(0)}</AvatarFallback></Avatar>
                    {m.user.name ?? m.user.email}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Story Points */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Hash className="h-3 w-3" /> Story Points</label>
          <Select value={story.storyPoints?.toString() ?? "none"} onValueChange={(v) => update({ storyPoints: v === "none" ? null : parseInt(v) })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None</SelectItem>
              {STORY_POINTS.map((sp) => <SelectItem key={sp} value={sp.toString()} className="text-xs">{sp} point{sp !== 1 ? "s" : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Feature (Stage) */}
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">Feature (Stage)</label>
          <Select value={story.featureId ?? "none"} onValueChange={(v) => update({ featureId: v === "none" ? null : v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs">None</SelectItem>
              {features.data?.map((f) => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* WSJF Detail Fields */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
        <span className="text-xs font-semibold">WSJF Breakdown</span>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">Value</label>
            <Select value={story.userBusinessValue.toString()} onValueChange={(v) => update({ userBusinessValue: parseInt(v) })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{[0, ...WSJF_SCALE].map((v) => <SelectItem key={v} value={v.toString()} className="text-xs">{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">Criticality</label>
            <Select value={story.timeCriticality.toString()} onValueChange={(v) => update({ timeCriticality: parseInt(v) })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{[0, ...WSJF_SCALE].map((v) => <SelectItem key={v} value={v.toString()} className="text-xs">{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-0.5">
            <label className="text-[10px] text-muted-foreground">Risk</label>
            <Select value={story.riskReduction.toString()} onValueChange={(v) => update({ riskReduction: parseInt(v) })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{[0, ...WSJF_SCALE].map((v) => <SelectItem key={v} value={v.toString()} className="text-xs">{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-0.5">
          <label className="text-[10px] text-muted-foreground">Job Size</label>
          <Select value={story.jobSize.toString()} onValueChange={(v) => update({ jobSize: parseInt(v) })}>
            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{STORY_POINTS.map((sp) => <SelectItem key={sp} value={sp.toString()} className="text-xs">{sp}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Reporter (read-only) */}
      <div className="space-y-1">
        <span className="text-xs text-muted-foreground">Reported by</span>
        <div className="flex items-center gap-2 text-xs">
          <Avatar className="h-5 w-5"><AvatarImage src={story.reporter.avatarUrl ?? undefined} /><AvatarFallback className="text-[8px]">{story.reporter.name?.charAt(0) ?? story.reporter.email.charAt(0)}</AvatarFallback></Avatar>
          <span>{story.reporter.name ?? story.reporter.email}</span>
        </div>
      </div>
    </div>
  );
}
