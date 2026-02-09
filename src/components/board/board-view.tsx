"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { BoardColumn } from "./board-column";
import { BoardFilterBar } from "./board-filter-bar";
import { CreateTicketDialog } from "../tickets/create-ticket-dialog";
import { TicketDetailSheet } from "../tickets/ticket-detail-sheet";
import { TicketCard } from "./ticket-card";
import { SprintBar } from "../sprint/sprint-bar";
import confetti from "canvas-confetti";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ProjectWithBoard = RouterOutputs["project"]["getByKey"];
type TicketType =
  ProjectWithBoard["boardColumns"][number]["tickets"][number];

export function BoardView({ project }: { project: ProjectWithBoard }) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<TicketType | null>(null);

  // Filter state
  const [filters, setFilters] = useState<{
    search: string;
    assigneeId: string;
    priority: string;
  }>({ search: "", assigneeId: "", priority: "" });

  // Track optimistic column state
  const [columnsState, setColumnsState] = useState(project.boardColumns);
  // Reset on new project data
  if (columnsState !== project.boardColumns && !activeTicket) {
    setColumnsState(project.boardColumns);
  }

  const moveMutation = trpc.ticket.move.useMutation({
    onSuccess: () => router.refresh(),
    onError: (err) => {
      toast.error(err.message);
      setColumnsState(project.boardColumns);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleAddTicket(columnId: string) {
    setTargetColumnId(columnId);
    setCreateDialogOpen(true);
  }

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const ticketId = active.id as string;

      for (const col of columnsState) {
        const ticket = col.tickets.find((t) => t.id === ticketId);
        if (ticket) {
          setActiveTicket(ticket);
          break;
        }
      }
    },
    [columnsState]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find source and target columns
      let sourceColIdx = -1;
      let targetColIdx = -1;

      for (let i = 0; i < columnsState.length; i++) {
        if (columnsState[i].tickets.some((t) => t.id === activeId)) sourceColIdx = i;
        if (
          columnsState[i].id === overId ||
          columnsState[i].tickets.some((t) => t.id === overId)
        )
          targetColIdx = i;
      }

      if (sourceColIdx === -1 || targetColIdx === -1 || sourceColIdx === targetColIdx)
        return;

      setColumnsState((prev) => {
        const newCols = prev.map((c) => ({ ...c, tickets: [...c.tickets] }));
        const ticketIdx = newCols[sourceColIdx].tickets.findIndex(
          (t) => t.id === activeId
        );
        if (ticketIdx === -1) return prev;

        const [movedTicket] = newCols[sourceColIdx].tickets.splice(ticketIdx, 1);
        const overTicketIdx = newCols[targetColIdx].tickets.findIndex(
          (t) => t.id === overId
        );
        if (overTicketIdx >= 0) {
          newCols[targetColIdx].tickets.splice(overTicketIdx, 0, movedTicket);
        } else {
          newCols[targetColIdx].tickets.push(movedTicket);
        }

        return newCols;
      });
    },
    [columnsState]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTicket(null);

      if (!over) {
        setColumnsState(project.boardColumns);
        return;
      }

      const ticketId = active.id as string;
      const overId = over.id as string;

      // Find the column the ticket ended up in
      let targetColumnId: string | null = null;
      let targetPosition = 0;

      for (const col of columnsState) {
        const idx = col.tickets.findIndex((t) => t.id === ticketId);
        if (idx >= 0) {
          targetColumnId = col.id;
          targetPosition = idx;
          break;
        }
      }

      if (!targetColumnId) {
        setColumnsState(project.boardColumns);
        return;
      }

      // Find the "Done" column
      const doneColumn = project.boardColumns.find(
        (c) => c.name.toLowerCase() === "done"
      );

      // Check if ticket was moved TO the Done column
      const originalColumn = project.boardColumns.find((col) =>
        col.tickets.some((t) => t.id === ticketId)
      );
      if (
        doneColumn &&
        targetColumnId === doneColumn.id &&
        originalColumn?.id !== doneColumn.id
      ) {
        // Fire confetti!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ["#22c55e", "#16a34a", "#4ade80"],
        });
      }

      moveMutation.mutate({
        ticketId,
        targetColumnId,
        targetPosition,
      });
    },
    [columnsState, project.boardColumns, moveMutation]
  );

  // Apply client-side filters
  const filteredColumns = columnsState.map((col) => ({
    ...col,
    tickets: col.tickets.filter((t) => {
      if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase()))
        return false;
      if (filters.assigneeId && t.assignee?.id !== filters.assigneeId) return false;
      if (filters.priority && (t as Record<string, unknown>).priority !== filters.priority)
        return false;
      return true;
    }),
  }));

  return (
    <div className="flex h-full flex-col">
      {/* Board Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono">
            {project.key}
          </Badge>
          <h1 className="text-lg font-semibold">{project.name}</h1>
          <span className="text-sm text-muted-foreground">
            {project._count.tickets} ticket{project._count.tickets !== 1 ? "s" : ""}
          </span>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Sprint Bar */}
      <SprintBar projectId={project.id} projectKey={project.key} />

      {/* Filter Bar */}
      <BoardFilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Board Columns with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1">
          <div className="flex h-full gap-4 p-6">
            {filteredColumns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                projectKey={project.key}
                onAddTicket={() => handleAddTicket(column.id)}
                onTicketClick={(ticketId) => setSelectedTicketId(ticketId)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeTicket ? (
            <div className="w-72 rotate-2 opacity-90">
              <TicketCard
                ticket={activeTicket}
                projectKey={project.key}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={project.id}
        projectKey={project.key}
        columnId={targetColumnId ?? undefined}
      />

      <TicketDetailSheet
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
}
