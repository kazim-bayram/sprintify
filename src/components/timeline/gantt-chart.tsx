"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus, ChevronRight, ChevronDown, Link2, Unlink, Trash2, GripVertical,
  Calendar, Loader2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PHASE_COLORS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PhaseData {
  id: string;
  name: string;
  color: string;
  position: number;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  _count: { stories: number; sprints: number };
  dependsOn: { predecessor: { id: string; name: string } }[];
}

interface SprintData {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  phaseId: string | null;
}

interface GanttChartProps {
  projectId: string;
  projectKey: string;
  methodology: "AGILE" | "WATERFALL" | "HYBRID";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 56;
const LABEL_WIDTH = 260;
const DAY_WIDTH = 32;
const MIN_BAR_WIDTH = 24;
const BAR_HEIGHT = 28;
const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function GanttChart({ projectId, projectKey, methodology }: GanttChartProps) {
  const utils = trpc.useUtils();
  const phasesQuery = trpc.phase.list.useQuery({ projectId }, { enabled: methodology !== "AGILE" });
  const sprintsQuery = trpc.sprint.list.useQuery({ projectId });

  const phases: PhaseData[] = (phasesQuery.data ?? []) as PhaseData[];
  const sprints: SprintData[] = (sprintsQuery.data ?? []) as SprintData[];

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [detailPhase, setDetailPhase] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);

  const createPhaseMut = trpc.phase.create.useMutation({
    onSuccess: () => { utils.phase.list.invalidate(); setCreateOpen(false); toast.success("Phase created"); },
    onError: (e) => toast.error(e.message),
  });
  const updatePhaseMut = trpc.phase.update.useMutation({
    onSuccess: (res) => {
      utils.phase.list.invalidate();
      if (res.warnings?.length) {
        res.warnings.forEach((w: string) => toast.warning(w));
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const deletePhaseMut = trpc.phase.delete.useMutation({
    onSuccess: () => { utils.phase.list.invalidate(); setDetailPhase(null); toast.success("Phase deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const addDepMut = trpc.phase.addDependency.useMutation({
    onSuccess: (res) => {
      utils.phase.list.invalidate();
      setConnecting(null);
      if (res.warnings?.length) res.warnings.forEach((w: string) => toast.warning(w));
      else toast.success("Dependency created");
    },
    onError: (e) => { toast.error(e.message); setConnecting(null); },
  });
  const removeDepMut = trpc.phase.removeDependency.useMutation({
    onSuccess: () => { utils.phase.list.invalidate(); toast.success("Dependency removed"); },
    onError: (e) => toast.error(e.message),
  });

  // ---- Compute timeline bounds ----
  const { timelineStart, totalDays, rows } = useMemo(() => {
    const allDates: Date[] = [];
    const rowItems: RowItem[] = [];

    if (methodology === "AGILE") {
      // Agile: rows are sprints
      for (const s of sprints) {
        const start = parseDate(s.startDate);
        const end = parseDate(s.endDate);
        if (start) allDates.push(start);
        if (end) allDates.push(end);
        rowItems.push({ type: "sprint", id: s.id, label: s.name, start, end, color: "#3B82F6", progress: 0, indent: 0, parentId: null });
      }
    } else {
      // Waterfall or Hybrid: rows are phases
      for (const p of phases) {
        const start = parseDate(p.startDate);
        const end = parseDate(p.endDate);
        if (start) allDates.push(start);
        if (end) allDates.push(end);
        rowItems.push({ type: "phase", id: p.id, label: p.name, start, end, color: p.color, progress: p.progress, indent: 0, parentId: null });

        if (methodology === "HYBRID" && expanded.has(p.id)) {
          // Show nested sprints inside the phase
          const phaseSprints = sprints.filter((s) => s.phaseId === p.id);
          for (const s of phaseSprints) {
            const sStart = parseDate(s.startDate);
            const sEnd = parseDate(s.endDate);
            if (sStart) allDates.push(sStart);
            if (sEnd) allDates.push(sEnd);
            rowItems.push({ type: "sprint", id: s.id, label: s.name, start: sStart, end: sEnd, color: "#60A5FA", progress: 0, indent: 1, parentId: p.id });
          }
        }

        if (expanded.has(p.id) && methodology === "WATERFALL") {
          // In waterfall show story count placeholder
          rowItems.push({ type: "info", id: `info-${p.id}`, label: `${p._count.stories} stories`, start: null, end: null, color: "#9CA3AF", progress: 0, indent: 1, parentId: p.id });
        }
      }
    }

    if (allDates.length === 0) {
      const today = new Date();
      allDates.push(today, addDays(today, 90));
    }

    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    const ts = addDays(minDate, -7);
    const td = daysBetween(ts, addDays(maxDate, 14));

    return { timelineStart: ts, totalDays: Math.max(td, 30), rows: rowItems };
  }, [phases, sprints, methodology, expanded]);

  // ---- Drag state ----
  const [dragging, setDragging] = useState<{ id: string; edge: "left" | "right" | "move"; startX: number; origStart: Date; origEnd: Date } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  function dateToX(d: Date): number {
    return daysBetween(timelineStart, d) * DAY_WIDTH;
  }

  const handleDragStart = useCallback((e: React.MouseEvent, row: RowItem, edge: "left" | "right" | "move") => {
    if (row.type !== "phase" || !row.start || !row.end) return;
    e.preventDefault();
    setDragging({ id: row.id, edge, startX: e.clientX, origStart: row.start, origEnd: row.end });
  }, []);

  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const daysDelta = Math.round(dx / DAY_WIDTH);
    if (daysDelta === 0) return;

    let newStart = dragging.origStart;
    let newEnd = dragging.origEnd;

    if (dragging.edge === "move") {
      newStart = addDays(dragging.origStart, daysDelta);
      newEnd = addDays(dragging.origEnd, daysDelta);
    } else if (dragging.edge === "left") {
      newStart = addDays(dragging.origStart, daysDelta);
      if (newStart >= newEnd) return;
    } else {
      newEnd = addDays(dragging.origEnd, daysDelta);
      if (newEnd <= newStart) return;
    }

    // We don't update state directly during drag — we just let it render the preview via CSS transform.
    // Instead the update happens on mouseUp.
  }, [dragging]);

  const handleDragEnd = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragging.startX;
    const daysDelta = Math.round(dx / DAY_WIDTH);

    if (daysDelta !== 0) {
      let newStart = dragging.origStart;
      let newEnd = dragging.origEnd;

      if (dragging.edge === "move") {
        newStart = addDays(dragging.origStart, daysDelta);
        newEnd = addDays(dragging.origEnd, daysDelta);
      } else if (dragging.edge === "left") {
        newStart = addDays(dragging.origStart, daysDelta);
      } else {
        newEnd = addDays(dragging.origEnd, daysDelta);
      }

      if (newStart < newEnd) {
        updatePhaseMut.mutate({
          id: dragging.id,
          startDate: toISODate(newStart),
          endDate: toISODate(newEnd),
        });
      }
    }

    setDragging(null);
  }, [dragging, updatePhaseMut]);

  // ---- Month headers ----
  const monthHeaders = useMemo(() => {
    const headers: { label: string; x: number; width: number }[] = [];
    let d = new Date(timelineStart);
    while (daysBetween(timelineStart, d) < totalDays) {
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const visibleStart = monthStart < timelineStart ? timelineStart : monthStart;
      const visibleEnd = daysBetween(timelineStart, monthEnd) > totalDays ? addDays(timelineStart, totalDays) : monthEnd;
      const x = dateToX(visibleStart);
      const width = daysBetween(visibleStart, visibleEnd) * DAY_WIDTH;
      headers.push({
        label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        x,
        width: Math.max(width, 0),
      });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    return headers;
  }, [timelineStart, totalDays]);

  // ---- Today line ----
  const todayX = dateToX(new Date());

  // ---- Click handler for connection ----
  function handleRowClick(rowId: string) {
    if (connecting && connecting !== rowId) {
      addDepMut.mutate({ predecessorId: connecting, successorId: rowId });
    }
  }

  const chartWidth = totalDays * DAY_WIDTH;
  const chartHeight = HEADER_HEIGHT + rows.length * ROW_HEIGHT;

  const isLoading = (methodology !== "AGILE" && phasesQuery.isLoading) || sprintsQuery.isLoading;

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <h2 className="text-lg font-semibold">
          {methodology === "AGILE" ? "Sprint Timeline" : methodology === "WATERFALL" ? "Gantt Chart" : "Hybrid Timeline"}
        </h2>
        <Badge variant="outline" className="text-xs">{methodology}</Badge>
        <div className="flex-1" />
        {connecting && (
          <Badge variant="destructive" className="animate-pulse">
            <Link2 className="mr-1 h-3 w-3" /> Click target phase to link...
            <button className="ml-2 underline" onClick={() => setConnecting(null)}>Cancel</button>
          </Badge>
        )}
        {methodology !== "AGILE" && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Phase
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-muted-foreground">
          <Calendar className="h-16 w-16" />
          <p className="text-lg font-medium">
            {methodology === "AGILE"
              ? "No sprints yet. Create a sprint to see the timeline."
              : "No phases yet. Add a phase to build your timeline."}
          </p>
          {methodology !== "AGILE" && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Create First Phase
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-1 overflow-auto">
          {/* Left labels panel */}
          <div className="shrink-0 border-r bg-background" style={{ width: LABEL_WIDTH }}>
            {/* Header */}
            <div className="flex h-14 items-center border-b px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {methodology === "AGILE" ? "Sprints" : "Phases"}
            </div>
            {rows.map((row) => (
              <div
                key={row.id}
                className={cn(
                  "flex h-11 items-center gap-2 border-b px-3 text-sm transition-colors",
                  row.type === "phase" ? "cursor-pointer hover:bg-muted/50" : "",
                  connecting ? "cursor-crosshair" : "",
                  row.indent > 0 ? "pl-8" : "",
                )}
                onClick={() => {
                  if (connecting && row.type === "phase") {
                    handleRowClick(row.id);
                    return;
                  }
                  if (row.type === "phase" && !connecting) {
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(row.id)) next.delete(row.id);
                      else next.add(row.id);
                      return next;
                    });
                  }
                }}
                onDoubleClick={() => {
                  if (row.type === "phase") setDetailPhase(row.id);
                }}
              >
                {row.type === "phase" && (
                  <>
                    {expanded.has(row.id) ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: row.color }} />
                  </>
                )}
                {row.type === "sprint" && <div className="h-2.5 w-2.5 rounded-full bg-blue-400 ml-1" />}
                <span className="truncate font-medium">{row.label}</span>
              </div>
            ))}
          </div>

          {/* SVG Timeline */}
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <svg
              ref={svgRef}
              width={chartWidth}
              height={chartHeight}
              className="select-none"
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              {/* Month headers */}
              {monthHeaders.map((m, i) => (
                <g key={i}>
                  <rect x={m.x} y={0} width={m.width} height={HEADER_HEIGHT} fill={i % 2 === 0 ? "var(--muted)" : "transparent"} opacity={0.4} />
                  <text x={m.x + 8} y={24} className="fill-foreground text-xs font-medium" fontSize={11}>{m.label}</text>
                  {/* Week ticks */}
                  {Array.from({ length: Math.floor(m.width / (DAY_WIDTH * 7)) }).map((_, wi) => (
                    <line key={wi} x1={m.x + (wi + 1) * DAY_WIDTH * 7} y1={HEADER_HEIGHT - 8} x2={m.x + (wi + 1) * DAY_WIDTH * 7} y2={HEADER_HEIGHT} stroke="var(--border)" strokeWidth={1} />
                  ))}
                </g>
              ))}
              <line x1={0} y1={HEADER_HEIGHT} x2={chartWidth} y2={HEADER_HEIGHT} stroke="var(--border)" strokeWidth={1} />

              {/* Row backgrounds */}
              {rows.map((_, i) => (
                <rect key={i} x={0} y={HEADER_HEIGHT + i * ROW_HEIGHT} width={chartWidth} height={ROW_HEIGHT} fill={i % 2 === 0 ? "transparent" : "var(--muted)"} opacity={0.15} />
              ))}

              {/* Today line */}
              {todayX >= 0 && todayX <= chartWidth && (
                <g>
                  <line x1={todayX} y1={0} x2={todayX} y2={chartHeight} stroke="#EF4444" strokeWidth={1.5} strokeDasharray="4 2" />
                  <text x={todayX + 4} y={HEADER_HEIGHT - 4} fontSize={9} className="fill-red-500 font-medium">Today</text>
                </g>
              )}

              {/* Dependency arrows */}
              {methodology !== "AGILE" && phases.map((p) =>
                p.dependsOn.map((dep) => {
                  const pred = phases.find((pp) => pp.id === dep.predecessor.id);
                  if (!pred) return null;
                  const predEnd = parseDate(pred.endDate);
                  const succStart = parseDate(p.startDate);
                  if (!predEnd || !succStart) return null;

                  const predRowIdx = rows.findIndex((r) => r.id === pred.id);
                  const succRowIdx = rows.findIndex((r) => r.id === p.id);
                  if (predRowIdx === -1 || succRowIdx === -1) return null;

                  const x1 = dateToX(predEnd);
                  const y1 = HEADER_HEIGHT + predRowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const x2 = dateToX(succStart);
                  const y2 = HEADER_HEIGHT + succRowIdx * ROW_HEIGHT + ROW_HEIGHT / 2;
                  const midX = x1 + (x2 - x1) / 2;

                  return (
                    <g key={`dep-${pred.id}-${p.id}`}>
                      <path
                        d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                        fill="none"
                        stroke="var(--muted-foreground)"
                        strokeWidth={1.5}
                        strokeDasharray="6 3"
                        opacity={0.6}
                      />
                      {/* Arrow head */}
                      <polygon
                        points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`}
                        fill="var(--muted-foreground)"
                        opacity={0.6}
                      />
                    </g>
                  );
                }),
              )}

              {/* Bars */}
              {rows.map((row, i) => {
                if (!row.start || !row.end) return null;

                // Apply drag delta for the active bar
                let barStart = row.start;
                let barEnd = row.end;
                if (dragging && dragging.id === row.id) {
                  // We don't preview during drag in this simpler version; the update fires on mouseUp
                }

                const x = dateToX(barStart);
                const w = Math.max(daysBetween(barStart, barEnd) * DAY_WIDTH, MIN_BAR_WIDTH);
                const y = HEADER_HEIGHT + i * ROW_HEIGHT + BAR_Y_OFFSET;

                return (
                  <g key={row.id}>
                    {/* Full bar */}
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={BAR_HEIGHT}
                      rx={6}
                      fill={row.color}
                      opacity={0.25}
                      className="transition-opacity"
                    />
                    {/* Progress fill */}
                    {row.progress > 0 && (
                      <rect
                        x={x}
                        y={y}
                        width={w * (row.progress / 100)}
                        height={BAR_HEIGHT}
                        rx={6}
                        fill={row.color}
                        opacity={0.6}
                      />
                    )}
                    {/* Main bar outline */}
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={BAR_HEIGHT}
                      rx={6}
                      fill="none"
                      stroke={row.color}
                      strokeWidth={1.5}
                      className={cn("cursor-grab", dragging?.id === row.id ? "cursor-grabbing" : "")}
                      onMouseDown={(e) => handleDragStart(e, row, "move")}
                    />
                    {/* Left resize handle */}
                    {row.type === "phase" && (
                      <rect
                        x={x}
                        y={y + 4}
                        width={6}
                        height={BAR_HEIGHT - 8}
                        rx={2}
                        fill={row.color}
                        opacity={0.8}
                        className="cursor-col-resize"
                        onMouseDown={(e) => handleDragStart(e, row, "left")}
                      />
                    )}
                    {/* Right resize handle */}
                    {row.type === "phase" && (
                      <rect
                        x={x + w - 6}
                        y={y + 4}
                        width={6}
                        height={BAR_HEIGHT - 8}
                        rx={2}
                        fill={row.color}
                        opacity={0.8}
                        className="cursor-col-resize"
                        onMouseDown={(e) => handleDragStart(e, row, "right")}
                      />
                    )}
                    {/* Bar label */}
                    <text
                      x={x + w / 2}
                      y={y + BAR_HEIGHT / 2 + 4}
                      textAnchor="middle"
                      fontSize={10}
                      className="fill-foreground font-medium pointer-events-none"
                    >
                      {w > 60 ? row.label : ""}
                    </text>
                    {/* Connector dot for dependency linking */}
                    {row.type === "phase" && !connecting && (
                      <circle
                        cx={x + w + 8}
                        cy={y + BAR_HEIGHT / 2}
                        r={5}
                        fill="var(--border)"
                        stroke="var(--background)"
                        strokeWidth={1.5}
                        className="cursor-pointer opacity-0 hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setConnecting(row.id); }}
                      >
                        <title>Create dependency from "{row.label}"</title>
                      </circle>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Create Phase Dialog */}
      <CreatePhaseDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
        onSubmit={(data) => createPhaseMut.mutate(data)}
        isPending={createPhaseMut.isPending}
      />

      {/* Phase Detail Dialog */}
      {detailPhase && (
        <PhaseDetailDialog
          phaseId={detailPhase}
          open={!!detailPhase}
          onOpenChange={(o) => { if (!o) setDetailPhase(null); }}
          onUpdate={(data) => updatePhaseMut.mutate(data)}
          onDelete={(id) => deletePhaseMut.mutate({ id })}
          onConnect={(id) => { setDetailPhase(null); setConnecting(id); }}
          onRemoveDep={(predId, succId) => removeDepMut.mutate({ predecessorId: predId, successorId: succId })}
          isPending={updatePhaseMut.isPending || deletePhaseMut.isPending}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row Item Type
// ---------------------------------------------------------------------------
interface RowItem {
  type: "phase" | "sprint" | "info";
  id: string;
  label: string;
  start: Date | null;
  end: Date | null;
  color: string;
  progress: number;
  indent: number;
  parentId: string | null;
}

// ---------------------------------------------------------------------------
// Create Phase Dialog
// ---------------------------------------------------------------------------
function CreatePhaseDialog({
  open, onOpenChange, projectId, onSubmit, isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectId: string;
  onSubmit: (data: { projectId: string; name: string; color: string; startDate?: string; endDate?: string }) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(PHASE_COLORS[0]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    onSubmit({
      projectId,
      name,
      color,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
    setName(""); setStartDate(""); setEndDate("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Phase</DialogTitle>
          <DialogDescription>Add a phase to the project timeline (e.g., Feasibility, Production).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phaseName">Phase Name</Label>
            <Input id="phaseName" placeholder="Feasibility Study" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PHASE_COLORS.map((c) => (
                <button key={c} type="button" className={cn("h-7 w-7 rounded-md border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent")} style={{ backgroundColor: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phaseStart">Start Date</Label>
              <Input id="phaseStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phaseEnd">End Date</Label>
              <Input id="phaseEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending || !name}>{isPending ? "Creating..." : "Create Phase"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Phase Detail Dialog (edit, dependencies, delete)
// ---------------------------------------------------------------------------
function PhaseDetailDialog({
  phaseId, open, onOpenChange, onUpdate, onDelete, onConnect, onRemoveDep, isPending,
}: {
  phaseId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onUpdate: (data: { id: string; name?: string; startDate?: string | null; endDate?: string | null; progress?: number; color?: string }) => void;
  onDelete: (id: string) => void;
  onConnect: (id: string) => void;
  onRemoveDep: (predId: string, succId: string) => void;
  isPending: boolean;
}) {
  const phaseQuery = trpc.phase.getById.useQuery({ id: phaseId });
  const phase = phaseQuery.data;

  const [editName, setEditName] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editProgress, setEditProgress] = useState(0);
  const [initialized, setInitialized] = useState(false);

  if (phase && !initialized) {
    setEditName(phase.name);
    setEditStart(phase.startDate ? new Date(phase.startDate).toISOString().split("T")[0] : "");
    setEditEnd(phase.endDate ? new Date(phase.endDate).toISOString().split("T")[0] : "");
    setEditProgress(phase.progress);
    setInitialized(true);
  }

  // Reset on close
  function handleClose(o: boolean) {
    if (!o) setInitialized(false);
    onOpenChange(o);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Phase Details</DialogTitle>
          <DialogDescription>Edit phase properties, manage dependencies, or delete.</DialogDescription>
        </DialogHeader>
        {!phase ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Progress ({editProgress}%)</Label>
              <input type="range" min={0} max={100} value={editProgress} onChange={(e) => setEditProgress(Number(e.target.value))} className="w-full accent-primary" />
            </div>

            {/* Dependencies */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Link2 className="h-3.5 w-3.5" /> Dependencies</Label>
              {phase.dependsOn.length === 0 ? (
                <p className="text-xs text-muted-foreground">No dependencies yet.</p>
              ) : (
                <div className="space-y-1">
                  {phase.dependsOn.map((dep) => (
                    <div key={dep.predecessor.id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                      <span>Depends on: <strong>{dep.predecessor.name}</strong></span>
                      <button className="text-destructive hover:underline text-xs" onClick={() => onRemoveDep(dep.predecessor.id, phase.id)}>
                        <Unlink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button size="sm" variant="outline" onClick={() => onConnect(phase.id)}>
                <Link2 className="mr-1 h-3.5 w-3.5" /> Add Dependency
              </Button>
            </div>

            {/* Info */}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>{phase.stories.length} stories</span>
              <span>{phase.sprints.length} sprints</span>
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete this phase? Stories and sprints will be unlinked.")) onDelete(phase.id); }}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() =>
                    onUpdate({
                      id: phase.id,
                      name: editName || undefined,
                      startDate: editStart || null,
                      endDate: editEnd || null,
                      progress: editProgress,
                    })
                  }
                >
                  {isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
