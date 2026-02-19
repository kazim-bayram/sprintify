"use client";

import { useState, useRef, useEffect } from "react";
import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hash, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { PRIORITIES, DEPARTMENTS, calculateWSJF } from "@/lib/constants";
import { useProjectTerminology } from "@/hooks/use-project-terminology";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ProjectWithBoard = RouterOutputs["project"]["getByKey"];

export function BacklogView({ project }: { project: ProjectWithBoard }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: sprints } = trpc.sprint.list.useQuery({ projectId: project.id });
  const { data: phases } = trpc.phase.list.useQuery({ projectId: project.id }, { enabled: project.methodology !== "AGILE" });

  const updateMutation = trpc.story.update.useMutation({
    onSuccess: () => { router.refresh(); utils.sprint.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const createStory = trpc.story.create.useMutation({
    onSuccess: () => {
      router.refresh();
      utils.project.getByKey.invalidate({ key: project.key });
      utils.story.listWbs?.invalidate({ projectId: project.id });
      toast.success("Ticket created");
    },
    onError: (e) => toast.error(e.message),
  });

  const backlogColumn = project.boardColumns.find((c) => c.colType === "BACKLOG") ?? project.boardColumns[0];

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

  const terminology = useProjectTerminology(project.methodology);
  const isWaterfall = terminology.isWaterfall;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono">{project.key}</Badge>
          <h1 className="text-lg font-semibold">{terminology.listLabel}</h1>
          <span className="text-sm text-muted-foreground">
            {sorted.length}{" "}
            {sorted.length === 1 ? terminology.ticketSingular : terminology.ticketPlural}
            {!isWaterfall && ` · ${totalBacklogPoints} pts`}
          </span>
        </div>
      </div>
      {!isWaterfall && activeSprint && (
        <div className="border-b bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
          Active sprint: <strong>{activeSprint.name}</strong> ({activeSprint._count.stories} stories)
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-6">
        {!isWaterfall && backlogColumn && (
          <QuickAddTicket
            projectId={project.id}
            columnId={backlogColumn.id}
            terminology={terminology}
            createMutation={createStory}
          />
        )}
        {isWaterfall && backlogColumn && (
          <QuickAddWaterfallTask
            projectId={project.id}
            columnId={backlogColumn.id}
            phases={phases ?? []}
            createMutation={createStory}
            updateMutation={updateMutation}
            onSuccess={() => {
              router.refresh();
              utils.project.getByKey.invalidate({ key: project.key });
              utils.story.listWbs?.invalidate({ projectId: project.id });
            }}
          />
        )}
        {sorted.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {isWaterfall
              ? "No tasks defined in the WBS."
              : "No stories in the backlog. All are assigned to a sprint."}
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((story) => {
              const priority = PRIORITIES.find((p) => p.value === (story.priority ?? "NONE"));
              const dept = DEPARTMENTS.find((d) => d.value === story.department);
              const wsjf = isWaterfall
                ? 0
                : calculateWSJF(
                    story.userBusinessValue,
                    story.timeCriticality,
                    story.riskReduction,
                    story.jobSize,
                  );
              return (
                <Card key={story.id} className="flex items-center gap-4 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">{project.key}-{story.number}</span>
                      {dept && <Badge style={{ backgroundColor: dept.color, color: "white" }} className="px-1.5 py-0 text-[10px]">{dept.shortLabel}</Badge>}
                      {!isWaterfall && wsjf > 0 && (
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px] font-bold border-primary text-primary"
                        >
                          WSJF {wsjf}
                        </Badge>
                      )}
                      {priority && priority.value !== "NONE" && <Badge variant={priority.color === "destructive" ? "destructive" : "secondary"} className="px-1.5 py-0 text-[10px]">{priority.label}</Badge>}
                      {!isWaterfall && story.storyPoints != null && (
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px] gap-0.5"
                        >
                          <Hash className="h-2.5 w-2.5" />
                          {story.storyPoints}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-0.5 truncate">{story.title}</p>
                  </div>
                  {story.assignee && (
                    <Avatar className="h-6 w-6 shrink-0"><AvatarImage src={story.assignee.avatarUrl ?? undefined} /><AvatarFallback className="text-[8px]">{story.assignee.name?.charAt(0) ?? "?"}</AvatarFallback></Avatar>
                  )}
                  {!isWaterfall && (activeSprint || planningSprints.length > 0) && (
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

// ─── Agile: Quick Add Ticket (single input, Enter to create) ─────────────────

type CreateStoryMutation = ReturnType<typeof trpc.story.create.useMutation>;
type Terminology = ReturnType<typeof useProjectTerminology>;

function QuickAddTicket({
  projectId,
  columnId,
  terminology,
  createMutation,
}: {
  projectId: string;
  columnId: string;
  terminology: Terminology;
  createMutation: CreateStoryMutation;
}) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const t = title.trim();
    if (!t || createMutation.isPending) return;
    createMutation.mutate({
      projectId,
      title: t,
      columnId,
      sprintId: null,
    });
    setTitle("");
    inputRef.current?.focus();
  };

  return (
    <Card className="mb-3 flex items-center gap-2 p-2">
      <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="+ Add a new story to backlog... (Press Enter)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
          }
        }}
        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
    </Card>
  );
}

// ─── Waterfall: Quick Add Task (Title, Start Date, Duration, Phase) ─────────

type PhaseItem = { id: string; name: string };
type UpdateStoryMutation = ReturnType<typeof trpc.story.update.useMutation>;

function QuickAddWaterfallTask({
  projectId,
  columnId,
  phases,
  createMutation,
  updateMutation,
  onSuccess,
}: {
  projectId: string;
  columnId: string;
  phases: PhaseItem[];
  createMutation: CreateStoryMutation;
  updateMutation: UpdateStoryMutation;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState("1");
  const [phaseId, setPhaseId] = useState<string | null>(phases[0]?.id ?? null);

  useEffect(() => {
    if (phases.length > 0 && !phaseId) setPhaseId(phases[0].id);
  }, [phases, phaseId]);

  const handleSubmit = () => {
    const t = title.trim();
    if (!t || createMutation.isPending) return;
    const start = startDate ? new Date(startDate) : new Date();
    const dur = Math.max(0, parseFloat(duration) || 1);
    const endDate = addDays(start, Math.ceil(dur));

    createMutation.mutate(
      {
        projectId,
        title: t,
        columnId,
        phaseId,
        sprintId: null,
      },
      {
        onSuccess: (story) => {
          updateMutation.mutate(
            {
              id: story.id,
              duration: dur,
              startDate: start.toISOString(),
              endDate: endDate.toISOString(),
              constraintType: "ASAP",
            },
            {
              onSuccess: () => {
                toast.success("Task created");
                setTitle("");
                setStartDate("");
                setDuration("1");
                onSuccess();
              },
              onError: (e) => toast.error(e.message),
            }
          );
        },
      }
    );
  };

  return (
    <Card className="mb-3 grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-2 p-2">
      <Input
        placeholder="+ New task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        className="border-0 bg-transparent shadow-none focus-visible:ring-0"
      />
      <Input
        type="date"
        value={startDate || format(new Date(), "yyyy-MM-dd")}
        onChange={(e) => setStartDate(e.target.value)}
        className="h-8 w-36 text-xs"
      />
      <Input
        type="number"
        min={0}
        step={0.5}
        placeholder="Days"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="h-8 w-20 text-xs"
      />
      <Select value={phaseId ?? "general"} onValueChange={(v) => setPhaseId(v === "general" ? null : v)}>
        <SelectTrigger className="h-8 w-36 text-xs">
          <SelectValue placeholder="Phase" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="general" className="text-xs">General</SelectItem>
          {phases.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="secondary"
        onClick={handleSubmit}
        disabled={!title.trim() || createMutation.isPending}
      >
        Add
      </Button>
    </Card>
  );
}
