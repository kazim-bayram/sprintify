"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChevronRight,
  ChevronDown,
  ArrowRightToLine,
  ArrowLeftToLine,
  Link2,
  Save,
  Play,
  Plus,
  Columns3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { CreateStoryDialog } from "@/components/stories/create-story-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WbsItem = RouterOutputs["story"]["listWbs"][number];

interface WaterfallViewProps {
  projectId: string;
  projectKey: string;
  methodology: "AGILE" | "WATERFALL" | "HYBRID";
}

const ROW_HEIGHT = 36;
const DAY_WIDTH = 4; // pixels per day
const MIN_BAR_WIDTH = 20;
const GANTT_COLUMNS_KEY = "sprintify-gantt-columns";

function getColumnPrefs(projectId: string): { start: boolean; end: boolean; duration: boolean; assignedTo: boolean } {
  if (typeof window === "undefined") return { start: true, end: true, duration: true, assignedTo: true };
  try {
    const raw = localStorage.getItem(GANTT_COLUMNS_KEY);
    if (!raw) return { start: true, end: true, duration: true, assignedTo: true };
    const parsed = JSON.parse(raw) as Record<string, { start?: boolean; end?: boolean; duration?: boolean; assignedTo?: boolean }>;
    const prefs = parsed[projectId];
    return {
      start: prefs?.start ?? true,
      end: prefs?.end ?? true,
      duration: prefs?.duration ?? true,
      assignedTo: prefs?.assignedTo ?? true,
    };
  } catch {
    return { start: true, end: true, duration: true, assignedTo: true };
  }
}

function saveColumnPrefsToStorage(projectId: string, prefs: { start: boolean; end: boolean; duration: boolean; assignedTo: boolean }) {
  try {
    const raw = localStorage.getItem(GANTT_COLUMNS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    all[projectId] = prefs;
    localStorage.setItem(GANTT_COLUMNS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function parseDate(s: string | Date | null | undefined): Date | null {
  if (!s) return null;
  const d = s instanceof Date ? s : new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function WaterfallView({ projectId, projectKey, methodology }: WaterfallViewProps) {
  const utils = trpc.useUtils();
  const [splitPosition, setSplitPosition] = useState(40); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string; value: string } | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [columnPrefs, setColumnPrefsState] = useState<{ start: boolean; end: boolean; duration: boolean; assignedTo: boolean }>({
    start: true,
    end: true,
    duration: true,
    assignedTo: true,
  });

  useEffect(() => {
    setColumnPrefsState(getColumnPrefs(projectId));
  }, [projectId]);

  function setColumnPrefs(next: Partial<{ start: boolean; end: boolean; duration: boolean; assignedTo: boolean }>) {
    const merged = { ...columnPrefs, ...next };
    setColumnPrefsState(merged);
    saveColumnPrefsToStorage(projectId, merged);
  }

  const wbsQuery = trpc.story.listWbs.useQuery({ projectId }, { enabled: methodology !== "AGILE" });
  const phasesQuery = trpc.phase.list.useQuery({ projectId }, { enabled: methodology !== "AGILE" });
  const phases = phasesQuery.data ?? [];
  const defaultPhaseId = phases[0]?.id ?? null;
  const updateStory = trpc.story.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated");
      utils.story.listWbs.invalidate({ projectId });
      setEditingCell(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const recalculateSchedule = trpc.waterfall.recalculateSchedule.useMutation({
    onSuccess: (result) => {
      toast.success(`Schedule recalculated. ${result.updated} tasks updated.`);
      utils.story.listWbs.invalidate({ projectId });
    },
    onError: (err) => toast.error(err.message),
  });

  const saveBaseline = trpc.waterfall.saveBaseline.useMutation({
    onSuccess: (result) => {
      toast.success(`Baseline saved for ${result.saved} tasks.`);
      utils.story.listWbs.invalidate({ projectId });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateHierarchy = trpc.waterfall.updateHierarchy.useMutation({
    onSuccess: () => {
      toast.success("Hierarchy updated");
      utils.story.listWbs.invalidate({ projectId });
    },
    onError: (err) => toast.error(err.message),
  });

  const createDependency = trpc.waterfall.createDependency.useMutation({
    onSuccess: () => {
      toast.success("Dependency created");
      utils.story.listWbs.invalidate({ projectId });
      setLinkingFrom(null);
      setSelectedTasks(new Set());
    },
    onError: (err) => toast.error(err.message),
  });

  // Build hierarchical tree structure
  const treeData = useMemo(() => {
    const items = (wbsQuery.data ?? []) as WbsItem[];
    const roots: WbsItem[] = [];

    for (const item of items) {
      if (!item.parentStoryId) {
        roots.push(item);
      }
    }

    function buildTree(parent: WbsItem | null, level: number): Array<WbsItem & { level: number; children: any[] }> {
      const children = items.filter((item) => item.parentStoryId === parent?.id);
      return children.map((item) => ({
        ...item,
        level,
        children: buildTree(item, level + 1),
      }));
    }

    return roots.map((root) => ({
      ...root,
      level: root.outlineLevel || 1,
      children: buildTree(root, (root.outlineLevel || 1) + 1),
    }));
  }, [wbsQuery.data]);

  // Flatten tree for display
  const flattenedRows = useMemo(() => {
    const result: Array<WbsItem & { level: number }> = [];
    function traverse(nodes: typeof treeData) {
      for (const node of nodes) {
        result.push({ ...node, level: node.level });
        if (expandedRows.has(node.id) && node.children.length > 0) {
          traverse(node.children as any);
        }
      }
    }
    traverse(treeData);
    return result;
  }, [treeData, expandedRows]);

  // Calculate timeline bounds
  const { timelineStart, totalDays } = useMemo(() => {
    const items = (wbsQuery.data ?? []) as WbsItem[];
    const dates: Date[] = [];
    for (const item of items) {
      if (item.startDate) dates.push(parseDate(item.startDate)!);
      if (item.endDate) dates.push(parseDate(item.endDate)!);
      if (item.baselineStartDate) dates.push(parseDate(item.baselineStartDate)!);
      if (item.baselineEndDate) dates.push(parseDate(item.baselineEndDate)!);
    }
    if (dates.length === 0) {
      const today = new Date();
      dates.push(today, addDays(today, 90));
    }
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const start = addDays(minDate, -7);
    const days = daysBetween(start, addDays(maxDate, 14));
    return { timelineStart: start, totalDays: Math.max(days, 60) };
  }, [wbsQuery.data]);

  function dateToX(d: Date): number {
    return daysBetween(timelineStart, d) * DAY_WIDTH;
  }

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const container = e.currentTarget as HTMLElement;
      const rect = container.getBoundingClientRect();
      const newPos = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.max(25, Math.min(75, newPos)));
    },
    [isResizing]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  function handleIndent(taskId: string) {
    const task = flattenedRows.find((t) => t.id === taskId);
    if (!task || task.level <= 1) return;
    const parent = flattenedRows.find((t) => t.id === task.parentStoryId);
    if (!parent) return;
    updateHierarchy.mutate({
      taskId,
      parentStoryId: task.parentStoryId,
      outlineLevel: task.level,
      wbsIndex: `${parent.wbsIndex || parent.number}.${task.number}`,
    });
  }

  function handleOutdent(taskId: string) {
    const task = flattenedRows.find((t) => t.id === taskId);
    if (!task || task.level <= 1) return;
    const grandparent = flattenedRows.find((t) => t.id === task.parentStoryId)?.parentStoryId;
    updateHierarchy.mutate({
      taskId,
      parentStoryId: grandparent || null,
      outlineLevel: task.level - 1,
      wbsIndex: grandparent ? undefined : undefined,
    });
  }

  function handleLinkTasks() {
    if (selectedTasks.size !== 2) {
      toast.error("Select exactly 2 tasks to link");
      return;
    }
    const [predId, succId] = Array.from(selectedTasks);
    createDependency.mutate({
      predecessorId: predId,
      successorId: succId,
      type: "FS",
      lag: 0,
    });
  }

  if (methodology === "AGILE") {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Waterfall WBS view is only available for Waterfall and Hybrid projects.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <h2 className="text-lg font-semibold">WBS & Gantt</h2>
        <Badge variant="outline" className="text-xs">{methodology}</Badge>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <Columns3 className="mr-1 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuCheckboxItem checked={columnPrefs.start} onCheckedChange={(v) => setColumnPrefs({ start: !!v })}>
              Start
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={columnPrefs.end} onCheckedChange={(v) => setColumnPrefs({ end: !!v })}>
              End
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={columnPrefs.duration} onCheckedChange={(v) => setColumnPrefs({ duration: !!v })}>
              Duration
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={columnPrefs.assignedTo} onCheckedChange={(v) => setColumnPrefs({ assignedTo: !!v })}>
              Assigned To
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" onClick={() => setAddTaskOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Add Task
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const task = Array.from(selectedTasks)[0];
            if (task) handleIndent(task);
          }}
          disabled={selectedTasks.size !== 1}
        >
          <ArrowRightToLine className="mr-1 h-4 w-4" />
          Indent
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const task = Array.from(selectedTasks)[0];
            if (task) handleOutdent(task);
          }}
          disabled={selectedTasks.size !== 1}
        >
          <ArrowLeftToLine className="mr-1 h-4 w-4" />
          Outdent
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleLinkTasks}
          disabled={selectedTasks.size !== 2}
        >
          <Link2 className="mr-1 h-4 w-4" />
          Link Tasks
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => recalculateSchedule.mutate({ projectId })}
          disabled={recalculateSchedule.isPending}
        >
          <Play className="mr-1 h-4 w-4" />
          Auto Schedule
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => saveBaseline.mutate({ projectId })}
          disabled={saveBaseline.isPending}
        >
          <Save className="mr-1 h-4 w-4" />
          Save Baseline
        </Button>
      </div>

      {/* Split View */}
      <div
        className="flex flex-1 overflow-hidden"
        onMouseMove={handleResize as any}
        onMouseUp={handleResizeEnd}
        onMouseLeave={handleResizeEnd}
      >
        {/* Left: WBS Grid */}
        <div className="overflow-auto border-r" style={{ width: `${splitPosition}%` }}>
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-20">WBS ID</TableHead>
                <TableHead>Task Name</TableHead>
                {columnPrefs.duration && <TableHead className="w-24">Duration</TableHead>}
                {columnPrefs.start && <TableHead className="w-32">Start</TableHead>}
                {columnPrefs.end && <TableHead className="w-32">Finish</TableHead>}
                {columnPrefs.assignedTo && <TableHead className="w-32">Assigned To</TableHead>}
                <TableHead className="w-40">Predecessors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flattenedRows.map((task) => {
                const hasChildren = (task as any).children?.length > 0;
                const isExpanded = expandedRows.has(task.id);
                const isSelected = selectedTasks.has(task.id);
                const start = parseDate(task.startDate);
                const end = parseDate(task.endDate);

                return (
                  <TableRow
                    key={task.id}
                    className={cn("cursor-pointer", isSelected && "bg-primary/10")}
                    onClick={() => {
                      setSelectedTasks((prev) => {
                        const next = new Set(prev);
                        if (next.has(task.id)) next.delete(task.id);
                        else next.add(task.id);
                        return next;
                      });
                    }}
                  >
                    <TableCell>
                      {hasChildren ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRows((prev) => {
                              const next = new Set(prev);
                              if (next.has(task.id)) next.delete(task.id);
                              else next.add(task.id);
                              return next;
                            });
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-4" />
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {task.wbsIndex || task.number}
                    </TableCell>
                    <TableCell>
                      <div style={{ paddingLeft: `${(task.level - 1) * 20}px` }} className="flex items-center gap-2">
                        {task.isMilestone && <Badge variant="secondary" className="text-[9px]">M</Badge>}
                        {editingCell?.id === task.id && editingCell.field === "title" ? (
                          <Input
                            autoFocus
                            className="h-7 text-xs"
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            onBlur={() => {
                              updateStory.mutate({ id: task.id, title: editingCell.value });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                          />
                        ) : (
                          <span
                            className="text-sm"
                            onDoubleClick={() => setEditingCell({ id: task.id, field: "title", value: task.title })}
                          >
                            {task.title}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    {columnPrefs.duration && (
                      <TableCell>
                        {editingCell?.id === task.id && editingCell.field === "duration" ? (
                          <Input
                            autoFocus
                            type="number"
                            className="h-7 w-20 text-xs"
                            value={editingCell.value}
                            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                            onBlur={() => {
                              const num = parseFloat(editingCell.value || "0");
                              updateStory.mutate({ id: task.id, duration: isNaN(num) ? 0 : num });
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                          />
                        ) : (
                          <span
                            className="text-xs"
                            onDoubleClick={() =>
                              setEditingCell({ id: task.id, field: "duration", value: String(task.duration) })
                            }
                          >
                            {task.duration}d
                          </span>
                        )}
                      </TableCell>
                    )}
                    {columnPrefs.start && (
                      <TableCell className="text-xs">
                        {start ? format(start, "MMM d, yyyy") : "—"}
                      </TableCell>
                    )}
                    {columnPrefs.end && (
                      <TableCell className="text-xs">
                        {end ? format(end, "MMM d, yyyy") : "—"}
                      </TableCell>
                    )}
                    {columnPrefs.assignedTo && (
                      <TableCell className="text-xs text-muted-foreground">
                        {"assignee" in task && task.assignee ? (task.assignee as { name: string }).name : "—"}
                      </TableCell>
                    )}
                    <TableCell className="text-xs text-muted-foreground">
                      {task.predecessors.length > 0
                        ? task.predecessors.map((p) => p.number).join(", ")
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Resizer */}
        <div
          className={cn(
            "w-1 cursor-col-resize bg-border hover:bg-primary transition-colors",
            isResizing && "bg-primary"
          )}
          onMouseDown={() => setIsResizing(true)}
        />

        {/* Right: Gantt Chart */}
        <div className="flex-1 overflow-auto" style={{ width: `${100 - splitPosition}%` }}>
          <div className="relative" style={{ height: `${flattenedRows.length * ROW_HEIGHT + 40}px` }}>
            <svg width={totalDays * DAY_WIDTH} height={flattenedRows.length * ROW_HEIGHT + 40}>
              {/* Month headers */}
              <g>
                {Array.from({ length: Math.ceil(totalDays / 30) }).map((_, i) => {
                  const monthStart = addDays(timelineStart, i * 30);
                  const x = dateToX(monthStart);
                  return (
                    <g key={i}>
                      <rect x={x} y={0} width={30 * DAY_WIDTH} height={40} fill="var(--muted)" opacity={0.3} />
                      <text x={x + 4} y={24} fontSize={11} className="fill-foreground">
                        {format(monthStart, "MMM yyyy")}
                      </text>
                    </g>
                  );
                })}
              </g>

              {/* Task bars */}
              {flattenedRows.map((task, idx) => {
                const start = parseDate(task.startDate);
                const end = parseDate(task.endDate);
                const baselineStart = parseDate(task.baselineStartDate);
                const baselineEnd = parseDate(task.baselineEndDate);
                const y = 40 + idx * ROW_HEIGHT + (ROW_HEIGHT - 24) / 2;

                if (!start || !end) return null;

                const x = dateToX(start);
                const width = Math.max(daysBetween(start, end) * DAY_WIDTH, MIN_BAR_WIDTH);
                const isCritical = false; // TODO: Calculate from float
                const isParent = (task as any).children?.length > 0;
                const hasBaseline = baselineStart && baselineEnd;

                return (
                  <g key={task.id}>
                    {/* Baseline (ghost bar) - shown as thin grey line underneath */}
                    {hasBaseline && (
                      <rect
                        x={dateToX(baselineStart)}
                        y={y + 26}
                        width={Math.max(daysBetween(baselineStart, baselineEnd) * DAY_WIDTH, MIN_BAR_WIDTH)}
                        height={2}
                        fill="#9CA3AF"
                        opacity={0.6}
                      />
                    )}
                    {/* Parent task: Black bracket bar (summary) */}
                    {isParent ? (
                      <>
                        <rect x={x} y={y + 4} width={4} height={16} fill="#000000" opacity={0.8} />
                        <rect x={x + width - 4} y={y + 4} width={4} height={16} fill="#000000" opacity={0.8} />
                        <line x1={x + 4} y1={y + 6} x2={x + width - 4} y2={y + 6} stroke="#000000" strokeWidth={2} opacity={0.8} />
                        <line x1={x + 4} y1={y + 18} x2={x + width - 4} y2={y + 18} stroke="#000000" strokeWidth={2} opacity={0.8} />
                      </>
                    ) : (
                      <>
                        {/* Standard task: Blue bar */}
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={24}
                          fill={isCritical ? "#EF4444" : "#3B82F6"}
                          rx={4}
                          opacity={0.8}
                        />
                        {/* Progress fill */}
                        {task.progress > 0 && (
                          <rect
                            x={x}
                            y={y}
                            width={(width * task.progress) / 100}
                            height={24}
                            fill={isCritical ? "#DC2626" : "#2563EB"}
                            rx={4}
                          />
                        )}
                        {/* Milestone diamond */}
                        {task.isMilestone && (
                          <polygon
                            points={`${x + width / 2},${y - 6} ${x + width / 2 + 6},${y} ${x + width / 2},${y + 6} ${x + width / 2 - 6},${y}`}
                            fill={isCritical ? "#EF4444" : "#8B5CF6"}
                            stroke="white"
                            strokeWidth={1}
                          />
                        )}
                      </>
                    )}
                    {/* Dependency arrows */}
                    {task.predecessors.map((pred) => {
                      const predTask = flattenedRows.find((t) => t.id === pred.id);
                      if (!predTask) return null;
                      const predEnd = parseDate(predTask.endDate);
                      if (!predEnd) return null;
                      const predIdx = flattenedRows.findIndex((t) => t.id === pred.id);
                      const predY = 40 + predIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                      const x1 = dateToX(predEnd);
                      const y1 = predY;
                      const x2 = x;
                      const y2 = y + 12;
                      return (
                        <g key={pred.id}>
                          <path
                            d={`M ${x1} ${y1} L ${x2 - 10} ${y1} L ${x2 - 10} ${y2} L ${x2} ${y2}`}
                            fill="none"
                            stroke="#6B7280"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                          />
                          <polygon
                            points={`${x2},${y2} ${x2 - 6},${y2 - 3} ${x2 - 6},${y2 + 3}`}
                            fill="#6B7280"
                          />
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      <CreateStoryDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        projectId={projectId}
        projectKey={projectKey}
        boardType="SPRINT_BOARD"
        methodology={methodology}
        defaultPhaseId={defaultPhaseId}
      />
    </div>
  );
}
