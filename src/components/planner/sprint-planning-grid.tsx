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
import { DEPARTMENTS, PRIORITIES, calculateWSJF } from "@/lib/constants";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type GridStory = RouterOutputs["planner"]["getGrid"][number];

interface SprintPlanningGridProps {
  projectId: string;
  projectKey: string;
  sprintId?: string;
}

export function SprintPlanningGrid({ projectId, projectKey, sprintId }: SprintPlanningGridProps) {
  const utils = trpc.useUtils();
  const gridQuery = trpc.planner.getGrid.useQuery({ projectId, sprintId });
  const membersQuery = trpc.member.list.useQuery();
  const featuresQuery = trpc.feature.list.useQuery({ projectId });

  // Expanded rows (track which stories show their tasks)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // New story input
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const newStoryRef = useRef<HTMLInputElement>(null);

  // Inline new task input per story
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

  const bulkCreate = trpc.planner.bulkCreateStory.useMutation({
    onSuccess: () => {
      utils.planner.getGrid.invalidate({ projectId, sprintId });
      setNewStoryTitle("");
      toast.success("Story created!");
    },
    onError: (e) => toast.error(e.message),
  });

  const addTask = trpc.planner.addTask.useMutation({
    onSuccess: (_, vars) => {
      utils.planner.getGrid.invalidate({ projectId, sprintId });
      setNewTaskInputs((prev) => ({ ...prev, [vars.storyId]: "" }));
    },
    onError: (e) => toast.error(e.message),
  });

  // Debounced inline update
  const updateStory = trpc.planner.inlineUpdateStory.useMutation({
    onSuccess: () => utils.planner.getGrid.invalidate({ projectId, sprintId }),
  });

  const updateTask = trpc.planner.inlineUpdateTask.useMutation({
    onSuccess: () => utils.planner.getGrid.invalidate({ projectId, sprintId }),
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
    bulkCreate.mutate({ projectId, title: newStoryTitle.trim(), sprintId });
  }

  function handleAddTask(storyId: string) {
    const title = newTaskInputs[storyId]?.trim();
    if (!title) return;
    addTask.mutate({ storyId, title });
  }

  const stories = gridQuery.data ?? [];
  const members = membersQuery.data ?? [];
  const features = featuresQuery.data ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Grid Header */}
      <div className="flex items-center justify-between border-b px-4 py-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">{projectKey}</Badge>
          <h2 className="text-sm font-semibold">Sprint Planning Grid</h2>
          <span className="text-xs text-muted-foreground">{stories.length} stories</span>
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
              <div className="grid grid-cols-[32px_40px_minmax(200px,2fr)_120px_100px_80px_60px_60px_60px_60px_70px] gap-0 border-b hover:bg-muted/20 items-center group">
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
                  />
                </div>

                {/* Feature */}
                <div className="px-1 py-1">
                  <Select
                    value={story.featureId ?? "__none"}
                    onValueChange={(v) => updateStory.mutate({ id: story.id, featureId: v === "__none" ? null : v })}
                  >
                    <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none" className="text-xs">—</SelectItem>
                      {features.map((f) => <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* Owner */}
                <div className="px-1 py-1">
                  <Select
                    value={story.assigneeId ?? "__none"}
                    onValueChange={(v) => updateStory.mutate({ id: story.id, assigneeId: v === "__none" ? null : v })}
                  >
                    <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none" className="text-xs">Unassigned</SelectItem>
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
                    value={story.department ?? "__none"}
                    onValueChange={(v) => updateStory.mutate({ id: story.id, department: v === "__none" ? null : v })}
                  >
                    <SelectTrigger className="h-7 text-[11px] border-0 bg-transparent shadow-none px-1"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none" className="text-xs">—</SelectItem>
                      {DEPARTMENTS.map((d) => <SelectItem key={d.value} value={d.value} className="text-xs">{d.shortLabel}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {/* WSJF: Value */}
                <InlineNumberCell
                  value={story.userBusinessValue}
                  max={10}
                  onChange={(v) => debouncedUpdate(story.id, { userBusinessValue: v })}
                />
                {/* WSJF: Time */}
                <InlineNumberCell
                  value={story.timeCriticality}
                  max={10}
                  onChange={(v) => debouncedUpdate(story.id, { timeCriticality: v })}
                />
                {/* WSJF: Risk */}
                <InlineNumberCell
                  value={story.riskReduction}
                  max={10}
                  onChange={(v) => debouncedUpdate(story.id, { riskReduction: v })}
                />
                {/* Job Size */}
                <InlineNumberCell
                  value={story.jobSize}
                  max={100}
                  min={1}
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
                        />
                      </div>
                      <div />
                      <div className="px-1 py-1">
                        <Select
                          value={task.assigneeId ?? "__none"}
                          onValueChange={(v) => updateTask.mutate({ id: task.id, assigneeId: v === "__none" ? null : v })}
                        >
                          <SelectTrigger className="h-6 text-[10px] border-0 bg-transparent shadow-none px-1"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none" className="text-xs">—</SelectItem>
                            {members.map((m) => <SelectItem key={m.user.id} value={m.user.id} className="text-xs">{m.user.name ?? m.user.email}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-5" />
                    </div>
                  ))}

                  {/* Add Task Row */}
                  <div className="grid grid-cols-[32px_40px_minmax(200px,2fr)_120px_100px_80px_60px_60px_60px_60px_70px] gap-0 border-b bg-muted/5 items-center">
                    <div />
                    <div />
                    <div className="px-2 py-1 pl-6 flex items-center gap-1">
                      <Input
                        value={newTaskInputs[story.id] ?? ""}
                        onChange={(e) => setNewTaskInputs((prev) => ({ ...prev, [story.id]: e.target.value }))}
                        placeholder="+ Add task..."
                        className="h-6 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 px-0"
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddTask(story.id); }}
                      />
                    </div>
                    <div className="col-span-8" />
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Add Story Row */}
        <form onSubmit={handleAddStory} className="grid grid-cols-[32px_40px_minmax(200px,2fr)_120px_100px_80px_60px_60px_60px_60px_70px] gap-0 border-b items-center">
          <div className="flex items-center justify-center">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div />
          <div className="px-2 py-1">
            <Input
              ref={newStoryRef}
              value={newStoryTitle}
              onChange={(e) => setNewStoryTitle(e.target.value)}
              placeholder="+ Add story (press Enter)..."
              className="h-7 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 font-medium"
            />
          </div>
          <div className="col-span-8" />
        </form>
      </div>
    </div>
  );
}

/** Inline editable text cell */
function InlineTextInput({ defaultValue, className, onSave }: { defaultValue: string; className?: string; onSave: (val: string) => void }) {
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

  if (!editing) {
    return (
      <span
        className={`block cursor-text truncate ${className ?? ""}`}
        onClick={() => setEditing(true)}
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
function InlineNumberCell({ value, onChange, min = 0, max = 10 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
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

  if (!editing) {
    return (
      <div className="px-1 py-1 text-center cursor-text" onClick={() => setEditing(true)}>
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
