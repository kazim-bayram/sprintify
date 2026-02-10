"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PRIORITIES, DEPARTMENTS, calculateWSJF } from "@/lib/constants";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ProjectWithBoard = RouterOutputs["project"]["getByKey"];

export function BacklogView({ project }: { project: ProjectWithBoard }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: sprints } = trpc.sprint.list.useQuery({ projectId: project.id });

  const updateMutation = trpc.story.update.useMutation({
    onSuccess: () => { router.refresh(); utils.sprint.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  // Stories without a sprint
  const allStories = project.boardColumns.flatMap((col) => col.stories);
  const backlogStories = allStories.filter((s) => !(s as any).sprintId);

  // Sort by WSJF desc, then priority
  const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 };
  const sorted = [...backlogStories].sort((a, b) => {
    const wsjfA = calculateWSJF(a.userBusinessValue, a.timeCriticality, a.riskReduction, a.jobSize);
    const wsjfB = calculateWSJF(b.userBusinessValue, b.timeCriticality, b.riskReduction, b.jobSize);
    if (wsjfB !== wsjfA) return wsjfB - wsjfA;
    return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
  });

  const planningSprints = sprints?.filter((s) => s.status === "PLANNING") ?? [];
  const activeSprint = sprints?.find((s) => s.status === "ACTIVE");
  const totalBacklogPoints = sorted.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono">{project.key}</Badge>
          <h1 className="text-lg font-semibold">Backlog</h1>
          <span className="text-sm text-muted-foreground">{sorted.length} stor{sorted.length !== 1 ? "ies" : "y"} · {totalBacklogPoints} pts</span>
        </div>
      </div>
      {activeSprint && (
        <div className="border-b bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
          Active sprint: <strong>{activeSprint.name}</strong> ({activeSprint._count.stories} stories)
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-6">
        {sorted.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No stories in the backlog. All are assigned to a sprint.</div>
        ) : (
          <div className="space-y-2">
            {sorted.map((story) => {
              const priority = PRIORITIES.find((p) => p.value === (story.priority ?? "NONE"));
              const dept = DEPARTMENTS.find((d) => d.value === story.department);
              const wsjf = calculateWSJF(story.userBusinessValue, story.timeCriticality, story.riskReduction, story.jobSize);
              return (
                <Card key={story.id} className="flex items-center gap-4 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{project.key}-{story.number}</span>
                      {dept && <Badge style={{ backgroundColor: dept.color, color: "white" }} className="px-1.5 py-0 text-[10px]">{dept.shortLabel}</Badge>}
                      {wsjf > 0 && <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold border-primary text-primary">WSJF {wsjf}</Badge>}
                      {priority && priority.value !== "NONE" && <Badge variant={priority.color === "destructive" ? "destructive" : "secondary"} className="px-1.5 py-0 text-[10px]">{priority.label}</Badge>}
                      {story.storyPoints != null && <Badge variant="outline" className="px-1.5 py-0 text-[10px] gap-0.5"><Hash className="h-2.5 w-2.5" />{story.storyPoints}</Badge>}
                    </div>
                    <p className="text-sm font-medium mt-0.5 truncate">{story.title}</p>
                  </div>
                  {story.assignee && (
                    <Avatar className="h-6 w-6 shrink-0"><AvatarImage src={story.assignee.avatarUrl ?? undefined} /><AvatarFallback className="text-[8px]">{story.assignee.name?.charAt(0) ?? "?"}</AvatarFallback></Avatar>
                  )}
                  {(activeSprint || planningSprints.length > 0) && (
                    <Select onValueChange={(sprintId) => updateMutation.mutate({ id: story.id, sprintId })}>
                      <SelectTrigger className="w-36 h-8 text-xs shrink-0"><SelectValue placeholder="Add to sprint" /></SelectTrigger>
                      <SelectContent>
                        {activeSprint && <SelectItem value={activeSprint.id} className="text-xs">{activeSprint.name} (Active)</SelectItem>}
                        {planningSprints.map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.name} (Planning)</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
