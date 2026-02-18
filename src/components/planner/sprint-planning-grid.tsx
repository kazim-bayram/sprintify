"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronRight, ChevronDown, GripVertical } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { DEPARTMENTS, PRIORITIES, STORY_POINTS, WSJF_SCALE, calculateWSJF } from "@/lib/constants";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type GridStory = RouterOutputs["planner"]["getGrid"][number];

interface SprintPlanningGridProps {
  projectId: string;
  projectKey: string;
  sprintId?: string;
}

export function SprintPlanningGrid({ projectId, projectKey, sprintId }: SprintPlanningGridProps) {
  const utils = trpc.useUtils();
  const sprintsQuery = trpc.sprint.list.useQuery({ projectId });
  const [viewFilter, setViewFilter] = useState<string>("BACKLOG");
  const sprints = sprintsQuery.data ?? [];
  const activeSprint = sprints.find((s) => s.status === "ACTIVE");

  const selectedSprint =
    viewFilter === "ACTIVE"
      ? activeSprint
      : viewFilter === "BACKLOG"
        ? undefined
        : sprints.find((s) => s.id === viewFilter);

  const selectedSprintId = selectedSprint?.id;
  const isHistoryMode = selectedSprint?.status === "CLOSED";

  const gridQuery = trpc.planner.getGrid.useQuery({ projectId, sprintId: selectedSprintId });
  const membersQuery = trpc.member.list.useQuery();
  const featuresQuery = trpc.feature.list.useQuery({ projectId });

  // Expanded rows (track which stories show their tasks)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // New story input
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStorySprintId, setNewStorySprintId] = useState<string>("__backlog");
  const [newStoryAssigneeId, setNewStoryAssigneeId] = useState<string>("__none");
  const [newStoryPoints, setNewStoryPoints] = useState<string>("none");
  const [newValue, setNewValue] = useState<string>("0");
  const [newTime, setNewTime] = useState<string>("0");
  const [newRisk, setNewRisk] = useState<string>("0");
  const newStoryRef = useRef<HTMLInputElement>(null);

  // Inline new task input per story
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

  const bulkCreate = trpc.planner.bulkCreateStory.useMutation({
    async onMutate(input) {
      await utils.planner.getGrid.cancel({ projectId, sprintId: selectedSprintId });
      const previous =
        utils.planner.getGrid.getData({ projectId, sprintId: selectedSprintId }) ?? [];

      const tempId = `temp-${Date.now()}`;
      const optimistic = {
        id: tempId,
        number: (previous[previous.length - 1]?.number ?? 0) + 1,
        title: input.title,
        status: "BACKLOG",
        priority: input.priority,
        department: (input.department as any) ?? null,
        featureId: input.featureId ?? null,
        feature: null,
        sprintId: input.sprintId ?? null,
        assigneeId: input.assigneeId ?? null,
        assignee: null,
        storyPoints: input.storyPoints ?? null,
        userBusinessValue: input.userBusinessValue,
        timeCriticality: input.timeCriticality,
        riskReduction: input.riskReduction,
        jobSize: input.jobSize,
        tasks: [],
        projectId,
      } as unknown as GridStory;

      utils.planner.getGrid.setData(
        { projectId, sprintId: selectedSprintId },
        [...previous, optimistic],
      );

      return { previous };
    },
    onSuccess: () => {
      setNewStoryTitle("");
      setNewStorySprintId("__backlog");
      setNewStoryAssigneeId("__none");
      setNewStoryPoints("none");
      setNewValue("0");
      setNewTime("0");
      setNewRisk("0");
      toast.success("Story created!");
    },
    onError: (e, _vars, context) => {
      if (context?.previous) {
        utils.planner.getGrid.setData(
          { projectId, sprintId: selectedSprintId },
          context.previous as GridStory[],
        );
      }
      toast.error(e.message);
    },
    onSettled: () => {
      utils.planner.getGrid.invalidate({ projectId, sprintId: selectedSprintId });
    },
  });

  const addTask = trpc.planner.addTask.useMutation({
    onSuccess: (_, vars) => {
      utils.planner.getGrid.invalidate({ projectId, sprintId: selectedSprintId });
      setNewTaskInputs((prev) => ({ ...prev, [vars.storyId]: "" }));
    },
    onError: (e) => toast.error(e.message),
  });

  // Debounced inline update
  const updateStory = trpc.planner.inlineUpdateStory.useMutation({
    onSuccess: () => utils.planner.getGrid.invalidate({ projectId, sprintId: selectedSprintId }),
  });

  const updateTask = trpc.planner.inlineUpdateTask.useMutation({
    onSuccess: () => utils.planner.getGrid.invalidate({ projectId, sprintId: selectedSprintId }),
  });

  // Debounce helper
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  function debouncedUpdate(id: string, data: Record<string, unknown>, isTask = false) {
    if (debounceTimers.current[id]) clearTimeout(debounceTimers.current[id]);
    debounceTimers.current[id] = setTimeout(() => {
      if (isTask) {
        updateTask.mutate({ id, ...data } as any);
      } else {
        updateStory.mutate({ id, ...data } as any);
      }
    }, 600);
  }

  function toggleExpand(id: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleAddStory(e: React.FormEvent) {
    e.preventDefault();
    if (!newStoryTitle.trim()) return;

    const sprintIdForStory =
      newStorySprintId === "__backlog"
        ? undefined
        : newStorySprintId === "__active"
          ? activeSprint?.id
          : newStorySprintId;

    const storyPoints =
      newStoryPoints === "none" ? null : parseInt(newStoryPoints, 10) || null;

    const userBusinessValue = parseInt(newValue, 10) || 0;
    const timeCriticality = parseInt(newTime, 10) || 0;
    const riskReduction = parseInt(newRisk, 10) || 0;
    const jobSize = storyPoints ?? 1;

    bulkCreate.mutate({
      projectId,
      title: newStoryTitle.trim(),
      sprintId: sprintIdForStory,
      assigneeId: newStoryAssigneeId === "__none" ? undefined : newStoryAssigneeId,
      storyPoints,
      userBusinessValue,
      timeCriticality,
      riskReduction,
      jobSize,
    });
  }

  function handleAddTask(storyId: string) {
    const title = newTaskInputs[storyId]?.trim();
    if (!title) return;
    addTask.mutate({ storyId, title });
  }

  const stories = gridQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const features = featuresQuery.data ?? [];
  const totalPoints = stories.reduce((sum, s) => sum + (s.storyPoints ?? 0), 0);
  const totalValue = stories.reduce((sum, s) => sum + (s.userBusinessValue ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      {/* Grid Header */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {projectKey}
          </Badge>
          <h2 className="text-sm font-semibold">Sprint Planning Grid</h2>
          <span className="text-xs text-muted-foreground">
            {stories.length} stories
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">View:</span>
          <Select value={viewFilter} onValueChange={setViewFilter}>
            <SelectTrigger className="h-7 min-w-[160px] text-[11px]">
              <SelectValue placeholder="Product Backlog" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BACKLOG" className="text-xs">
                Product Backlog
              </SelectItem>
              {activeSprint && (
                <SelectItem value="ACTIVE" className="text-xs">
                  Active Sprint — {activeSprint.name}
                </SelectItem>
              )}
              {sprints
                .filter((s) => s.status === "PLANNING")
                .map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} (Future)
                  </SelectItem>
                ))}
              {sprints
                .filter((s) => s.status === "CLOSED")
                .map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} (Past)
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[32px_40px_minmax(200px,2fr)_120px_100px_80px_60px_60px_60px_60px_70px] gap-0 border-b bg-muted/20 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="px-1 py-2" />
        <div className="px-1 py-2">#</div>
        <div className="px-2 py-2">Story / Task</div>
        <div className="px-2 py-2">Feature</div>
        <div className="px-2 py-2">Owner</div>
        <div className="px-2 py-2">Dept</div>
        <div className="px-1 py-2 text-center">Value</div>
        <div className="px-1 py-2 text-center">Time</div>
        <div className="px-1 py-2 text-center">Risk</div>
        <div className="px-1 py-2 text-center">Size</div>
        <div className="px-1 py-2 text-center">WSJF</div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {stories.map((story) => {
          const isExpanded = expandedRows.has(story.id);
          const wsjf = calculateWSJF(story.userBusinessValue, story.timeCriticality, story.riskReduction, story.jobSize);
          const dept = DEPARTMENTS.find((d) => d.value === story.department);

          return (
            <div key={story.id}>
              {/* Story Row */}
              <div
                className={`grid grid-cols-[32px_40px_minmax(200px,2fr)_120px_100px_80px_60px_60px_60px_60px_70px] gap-0 border-b items-center group ${
                  wsjf > 20 ? "bg-amber-50/60 dark:bg-amber-950/20" : "hover:bg-muted/20"
                }`}
              >
                {/* Expand toggle */}
                <button className="flex items-center justify-center h-full" onClick={() => toggleExpand(story.id)}>
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>

                {/* Number */}
                <div className="px-1 py-1.5 text-xs text-muted-foreground font-mono">{story.number}</div>

                {/* Title (editable) */}
                <div className="px-2 py-1">
                  <InlineTextInput
                    defaultValue={story.title}
                    className="text-sm font-medium"
                    onSave={(val) => debouncedUpdate(story.id, { title: val })}
                    disabled={isHistoryMode}
                  />
                </div>

                {/* Feature */}
                <div className="px-1 py-1">
                  <Select
                    disabled={isHistoryMode}
                    value={story.featureId ?? "__none"}
                    onValueChange={(v) =>
                      updateStory.mutate({
                        id: story.id,
                        featureId: v === "__none" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none" className="text-xs">
                        —
                      </SelectItem>
                      {features.map((f) => (
                        <SelectItem key={f.id} value={f.id} className="text-xs">
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Owner */}
                <div className="px-1 py-1">
                  <Select
                    disabled={isHistoryMode}
                    value={story.assigneeId ?? "__none"}
                    onValueChange={(v) =>
                      updateStory.mutate({
                        id: story.id,
                        assigneeId: v === "__none" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none" className="text-xs">
                        Unassigned
                      </SelectItem>
                      {members.map((m) => (
                        <SelectItem key={m.user.id} value={m.user.id} className="text-xs">
                          {m.user.name ?? m.user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dept */}
                <div className="px-1 py-1">
                  <Select
                    disabled={isHistoryMode}
                    value={story.department ?? "__none"}
                    onValueChange={(v) =>
                      updateStory.mutate({
                        id: story.id,
                        department: v === "__none" ? null : v,
                      })
                    }
                  >
                    <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none" className="text-xs">
                        —
                      </SelectItem>
                      {DEPARTMENTS.map((d) => (
                        <SelectItem key={d.value} value={d.value} className="text-xs">
                          {d.shortLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* WSJF: Value */}
                <InlineNumberCell
                  value={story.userBusinessValue}
                  max={10}
                  disabled={isHistoryMode}
                  onChange={(v) => debouncedUpdate(story.id, { userBusinessValue: v })}
                />
                {/* WSJF: Time */}
                <InlineNumberCell
                  value={story.timeCriticality}
                  max={10}
                  disabled={isHistoryMode}
                  onChange={(v) => debouncedUpdate(story.id, { timeCriticality: v })}
                />
                {/* WSJF: Risk */}
                <InlineNumberCell
                  value={story.riskReduction}
                  max={10}
                  disabled={isHistoryMode}
                  onChange={(v) => debouncedUpdate(story.id, { riskReduction: v })}
                />
                {/* Job Size */}
                <InlineNumberCell
                  value={story.jobSize}
                  max={100}
                  min={1}
                  disabled={isHistoryMode}
                  onChange={(v) => debouncedUpdate(story.id, { jobSize: v })}
                />
                {/* WSJF Score */}
                <div className="px-1 py-1 text-center">
                  <Badge variant={wsjf >= 5 ? "default" : "secondary"} className="text-[10px] font-mono">
                    {wsjf || "—"}
                  </Badge>
                </div>
              </div>

              {/* Task Rows (expanded) */}
              {isExpanded && (
                <>
                  {story.tasks.map((task) => (
                    <div key={task.id} className="grid grid-cols-[32px_40px_minmax(200px,2fr)_120px_100px_80px_60px_60px_60px_60px_70px] gap-0 border-b bg-muted/5 items-center">
                      <div />
                      <div className="px-1 py-1 text-xs text-muted-foreground">
                        <GripVertical className="h-3 w-3 opacity-30" />
                      </div>
                      <div className="px-2 py-1 pl-6">
                        <InlineTextInput
                          defaultValue={task.title}
                          className="text-xs"
                          onSave={(val) => debouncedUpdate(task.id, { title: val }, true)}
                          disabled={isHistoryMode}
                        />
                      </div>
                      <div />
                      <div className="px-1 py-1">
                        <Select
                          disabled={isHistoryMode}
                          value={task.assigneeId ?? "__none"}
                          onValueChange={(v) =>
                            updateTask.mutate({
                              id: task.id,
                              assigneeId: v === "__none" ? null : v,
                            })
                          }
                        >
                          <SelectTrigger className="h-6 text-[10px] border-0 bg-transparent shadow-none px-1">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none" className="text-xs">
                              —
                            </SelectItem>
                            {members.map((m) => (
                              <SelectItem key={m.user.id} value={m.user.id} className="text-xs">
                                {m.user.name ?? m.user.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-5" />
                    </div>
                  ))}

                  {/* Add Task Row */}
                  {!isHistoryMode && (
                    <div className="grid grid-cols-[32px_40px_minmax(200px,2fr)_120px_100px_80px_60px_60px_60px_60px_70px] gap-0 border-b bg-muted/5 items-center">
                      <div />
                      <div />
                      <div className="px-2 py-1 pl-6 flex items-center gap-1">
                        <Input
                          value={newTaskInputs[story.id] ?? ""}
                          onChange={(e) =>
                            setNewTaskInputs((prev) => ({
                              ...prev,
                              [story.id]: e.target.value,
                            }))
                          }
                          placeholder="+ Add task..."
                          className="h-6 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTask(story.id);
                          }}
                        />
                      </div>
                      <div className="col-span-8" />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Add Story Row (inline create) */}
        {!isHistoryMode && (
          <form
            onSubmit={handleAddStory}
            className="grid grid-cols-[32px_40px_minmax(200px,2fr)_120px_100px_80px_60px_60px_60px_60px_70px] gap-0 border-b items-center bg-muted/10"
          >
            <div className="flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div />
            {/* Title */}
            <div className="px-2 py-1">
              <Input
                ref={newStoryRef}
                value={newStoryTitle}
                onChange={(e) => setNewStoryTitle(e.target.value)}
                placeholder="Type title and press Enter..."
                className="h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 font-medium"
              />
            </div>
            {/* Sprint (in Feature column) */}
            <div className="px-1 py-1">
              <Select
                value={newStorySprintId}
                onValueChange={setNewStorySprintId}
              >
                <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1">
                  <SelectValue placeholder="Backlog" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__backlog" className="text-xs">
                    Backlog
                  </SelectItem>
                  {activeSprint && (
                    <SelectItem value="__active" className="text-xs">
                      Active — {activeSprint.name}
                    </SelectItem>
                  )}
                  {sprints
                    .filter((s) => s.status !== "CLOSED")
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* Owner */}
            <div className="px-1 py-1">
              <Select
                value={newStoryAssigneeId}
                onValueChange={setNewStoryAssigneeId}
              >
                <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none" className="text-xs">
                    Unassigned
                  </SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id} className="text-xs">
                      {m.user.name ?? m.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Dept (optional) */}
            <div className="px-1 py-1" />
            {/* WSJF: Value */}
            <div className="px-1 py-1">
              <Select value={newValue} onValueChange={setNewValue}>
                <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" className="text-xs">
                    0
                  </SelectItem>
                  {WSJF_SCALE.map((v) => (
                    <SelectItem key={v} value={v.toString()} className="text-xs">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* WSJF: Time */}
            <div className="px-1 py-1">
              <Select value={newTime} onValueChange={setNewTime}>
                <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" className="text-xs">
                    0
                  </SelectItem>
                  {WSJF_SCALE.map((v) => (
                    <SelectItem key={v} value={v.toString()} className="text-xs">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* WSJF: Risk */}
            <div className="px-1 py-1">
              <Select value={newRisk} onValueChange={setNewRisk}>
                <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" className="text-xs">
                    0
                  </SelectItem>
                  {WSJF_SCALE.map((v) => (
                    <SelectItem key={v} value={v.toString()} className="text-xs">
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Size (Story Points) */}
            <div className="px-1 py-1">
              <Select
                value={newStoryPoints}
                onValueChange={setNewStoryPoints}
              >
                <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    None
                  </SelectItem>
                  {STORY_POINTS.map((sp) => (
                    <SelectItem key={sp} value={sp.toString()} className="text-xs">
                      {sp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* WSJF preview (computed) */}
            <div className="px-1 py-1 text-center">
              <Badge variant="secondary" className="text-[10px] font-mono">
                {calculateWSJF(
                  parseInt(newValue, 10) || 0,
                  parseInt(newTime, 10) || 0,
                  parseInt(newRisk, 10) || 0,
                  newStoryPoints === "none" ? 1 : parseInt(newStoryPoints, 10) || 1,
                ) || "—"}
              </Badge>
            </div>
          </form>
        )}
      </div>
      {/* Totals row */}
      <div className="grid grid-cols-[32px_40px_minmax(200px,2fr)_120px_100px_80px_60px_60px_60px_60px_70px] gap-0 border-t bg-muted/30 text-[11px]">
        <div />
        <div />
        <div className="px-2 py-1 font-medium text-xs">Totals</div>
        <div />
        <div />
        <div />
        <div className="px-1 py-1 text-center text-xs text-muted-foreground">
          {totalValue}
        </div>
        <div />
        <div />
        <div className="px-1 py-1 text-center text-xs text-muted-foreground">
          {totalPoints}
        </div>
        <div />
      </div>
    </div>
  );
}

/** Inline editable text cell */
function InlineTextInput({
  defaultValue,
  className,
  onSave,
  disabled = false,
}: {
  defaultValue: string;
  className?: string;
  onSave: (val: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setValue(defaultValue); }, [defaultValue]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  function handleBlur() {
    setEditing(false);
    if (value.trim() && value !== defaultValue) {
      onSave(value.trim());
    } else {
      setValue(defaultValue);
    }
  }

  if (disabled || !editing) {
    return (
      <span
        className={`block truncate ${disabled ? "" : "cursor-text"} ${className ?? ""}`}
        onClick={disabled ? undefined : () => setEditing(true)}
      >
        {value || <span className="text-muted-foreground italic">Untitled</span>}
      </span>
    );
  }

  return (
    <input
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === "Enter") handleBlur(); if (e.key === "Escape") { setValue(defaultValue); setEditing(false); } }}
      className={`w-full bg-transparent outline-none border-b border-primary/50 ${className ?? ""}`}
    />
  );
}

/** Inline number cell for WSJF inputs */
function InlineNumberCell({
  value,
  onChange,
  min = 0,
  max = 10,
  disabled = false,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value.toString());
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(value.toString()); }, [value]);
  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);

  function handleBlur() {
    setEditing(false);
    const num = parseInt(val) || min;
    const clamped = Math.max(min, Math.min(max, num));
    if (clamped !== value) onChange(clamped);
    setVal(clamped.toString());
  }

  if (disabled || !editing) {
    return (
      <div
        className={`px-1 py-1 text-center ${disabled ? "" : "cursor-text"}`}
        onClick={disabled ? undefined : () => setEditing(true)}
      >
        <span className="text-xs tabular-nums">{value}</span>
      </div>
    );
  }

  return (
    <div className="px-0.5 py-0.5">
      <input
        ref={ref}
        type="number"
        min={min}
        max={max}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === "Enter") handleBlur(); if (e.key === "Escape") { setVal(value.toString()); setEditing(false); } }}
        className="w-full text-xs text-center bg-transparent outline-none border-b border-primary/50 tabular-nums"
      />
    </div>
  );
}
