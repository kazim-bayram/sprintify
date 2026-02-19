"use client";

import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Plus, Square, BarChart3, Clock, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CreateSprintDialog } from "./create-sprint-dialog";
import { SprintRolloverModal } from "./sprint-rollover-modal";
import { BurndownDialog } from "./burndown-dialog";

export function SprintBar({ projectId, projectKey }: { projectId: string; projectKey: string }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [rolloverOpen, setRolloverOpen] = useState(false);
  const [burndownOpen, setBurndownOpen] = useState(false);

  const { data: activeSprint } = trpc.sprint.getActive.useQuery({ projectId });
  const { data: sprints } = trpc.sprint.list.useQuery({ projectId });
  const planningSprints = sprints?.filter((s) => s.status === "PLANNING") ?? [];

  const startMutation = trpc.sprint.start.useMutation({
    onSuccess: () => { toast.success("Sprint started!"); router.refresh(); },
    onError: (e) => toast.error(e.message),
  });

  const totalPoints = activeSprint?.stories.reduce((s, t) => s + (t.storyPoints ?? 0), 0) ?? 0;
  const completedPoints = activeSprint?.stories.filter((t) => t.status === "DONE").reduce((s, t) => s + (t.storyPoints ?? 0), 0) ?? 0;
  const progressPct = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
  const daysRemaining = activeSprint?.endDate ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  if (activeSprint) {
    return (
      <>
        <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-2">
          <Badge className="bg-green-600 text-white">Active</Badge>
          <span className="text-sm font-medium">{activeSprint.name}</span>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Progress value={progressPct} className="w-24 h-2" />
              <span>{completedPoints}/{totalPoints} pts ({progressPct}%)</span>
            </div>
            {daysRemaining !== null && <Badge variant="outline" className="text-xs gap-1"><Clock className="h-3 w-3" />{daysRemaining}d left</Badge>}
            <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
              <Link href={`/projects/${projectKey.toLowerCase()}/retro/${activeSprint.id}`}>
                <MessageSquare className="mr-1 h-3.5 w-3.5" />Retro
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setBurndownOpen(true)}><BarChart3 className="mr-1 h-3.5 w-3.5" />Burndown</Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setRolloverOpen(true)}><Square className="mr-1 h-3 w-3" />Close Sprint</Button>
          </div>
        </div>
        <SprintRolloverModal open={rolloverOpen} onOpenChange={setRolloverOpen} sprintId={activeSprint.id} sprintName={activeSprint.name} projectId={projectId} />
        <BurndownDialog open={burndownOpen} onOpenChange={setBurndownOpen} sprintId={activeSprint.id} sprintName={activeSprint.name} />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b bg-muted/30 px-6 py-2">
        <Badge variant="secondary">No Active Sprint</Badge>
        <div className="flex items-center gap-2 ml-auto">
          {planningSprints.length > 0 && (
            <>
              <span className="text-xs text-muted-foreground">{planningSprints[0].name} ({planningSprints[0]._count.stories} stories)</span>
              <Button size="sm" className="h-7 text-xs" onClick={() => { const now = new Date(); const two = new Date(now.getTime() + 14 * 86400000); startMutation.mutate({ id: planningSprints[0].id, startDate: now.toISOString(), endDate: two.toISOString() }); }} disabled={startMutation.isPending}>
                <Play className="mr-1 h-3 w-3" />Start Sprint
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCreateOpen(true)}><Plus className="mr-1 h-3 w-3" />New Sprint</Button>
        </div>
      </div>
      <CreateSprintDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </>
  );
}
