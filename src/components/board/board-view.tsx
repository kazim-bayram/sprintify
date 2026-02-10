"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useState, useCallback, useRef } from "react";
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
import { CreateStoryDialog } from "../stories/create-story-dialog";
import { StoryDetailSheet } from "../stories/story-detail-sheet";
import { TicketCard } from "./ticket-card";
import { SprintBar } from "../sprint/sprint-bar";
import confetti from "canvas-confetti";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ProjectWithBoard = RouterOutputs["project"]["getByKey"];
type StoryType = ProjectWithBoard["boardColumns"][number]["stories"][number];

export function BoardView({ project, boardType = "SPRINT_BOARD" }: { project: ProjectWithBoard; boardType?: "SPRINT_BOARD" | "GLOBAL_PRODUCT_BACKLOG" }) {
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [activeStory, setActiveStory] = useState<StoryType | null>(null);

  // Filter state
  const [filters, setFilters] = useState<{
    search: string;
    assigneeId: string;
    priority: string;
  }>({ search: "", assigneeId: "", priority: "" });

  // ===================================================================
  // OPTIMISTIC UI: Track column state locally for instant DnD feedback
  // ===================================================================
  const [columnsState, setColumnsState] = useState(project.boardColumns);
  const prevProjectRef = useRef(project.boardColumns);

  // Sync from server when not dragging
  if (prevProjectRef.current !== project.boardColumns && !activeStory) {
    prevProjectRef.current = project.boardColumns;
    setColumnsState(project.boardColumns);
  }

  const moveMutation = trpc.story.move.useMutation({
    // Background sync — UI already updated optimistically
    onSuccess: () => router.refresh(),
    onError: (err) => {
      // REVERT: If server rejects (WIP limit, DoD quality gate), revert to server state
      toast.error(err.message ?? "Failed to move story. Reverting.");
      setColumnsState(project.boardColumns);
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleAddStory(columnId: string) {
    setTargetColumnId(columnId);
    setCreateDialogOpen(true);
  }

  // --- DRAG START: Pick up the card ---
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const storyId = event.active.id as string;
      for (const col of columnsState) {
        const story = col.stories.find((s) => s.id === storyId);
        if (story) {
          setActiveStory(story);
          break;
        }
      }
    },
    [columnsState]
  );

  // --- DRAG OVER: Instant cross-column move (optimistic) ---
  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      let sourceColIdx = -1;
      let targetColIdx = -1;

      for (let i = 0; i < columnsState.length; i++) {
        if (columnsState[i].stories.some((s) => s.id === activeId)) sourceColIdx = i;
        if (columnsState[i].id === overId || columnsState[i].stories.some((s) => s.id === overId))
          targetColIdx = i;
      }

      if (sourceColIdx === -1 || targetColIdx === -1 || sourceColIdx === targetColIdx) return;

      setColumnsState((prev) => {
        const newCols = prev.map((c) => ({ ...c, stories: [...c.stories] }));
        const storyIdx = newCols[sourceColIdx].stories.findIndex((s) => s.id === activeId);
        if (storyIdx === -1) return prev;

        const [movedStory] = newCols[sourceColIdx].stories.splice(storyIdx, 1);
        const overStoryIdx = newCols[targetColIdx].stories.findIndex((s) => s.id === overId);
        if (overStoryIdx >= 0) {
          newCols[targetColIdx].stories.splice(overStoryIdx, 0, movedStory);
        } else {
          newCols[targetColIdx].stories.push(movedStory);
        }
        return newCols;
      });
    },
    [columnsState]
  );

  // --- DRAG END: Commit the move optimistically, sync in background ---
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveStory(null);

      if (!over) {
        setColumnsState(project.boardColumns);
        return;
      }

      const storyId = active.id as string;

      // Find where the story landed in optimistic state
      let targetCol: string | null = null;
      let targetPosition = 0;

      for (const col of columnsState) {
        const idx = col.stories.findIndex((s) => s.id === storyId);
        if (idx >= 0) {
          targetCol = col.id;
          targetPosition = idx;
          break;
        }
      }

      if (!targetCol) {
        setColumnsState(project.boardColumns);
        return;
      }

      // Confetti on completing a story (moved to Done column)
      const doneColumn = project.boardColumns.find((c) => c.name.toLowerCase() === "done");
      const originalColumn = project.boardColumns.find((col) =>
        col.stories.some((s) => s.id === storyId)
      );
      if (doneColumn && targetCol === doneColumn.id && originalColumn?.id !== doneColumn.id) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ["#22c55e", "#16a34a", "#4ade80"] });
      }

      // Fire background mutation — UI already shows the result
      moveMutation.mutate({ storyId, targetColumnId: targetCol, targetPosition });
    },
    [columnsState, project.boardColumns, moveMutation]
  );

  // Client-side filtering
  const filteredColumns = columnsState.map((col) => ({
    ...col,
    stories: col.stories.filter((s) => {
      if (filters.search && !s.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.assigneeId && s.assignee?.id !== filters.assigneeId) return false;
      if (filters.priority && s.priority !== filters.priority) return false;
      return true;
    }),
  }));

  return (
    <div className="flex h-full flex-col">
      {/* Board Header — NPD terminology */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono">{project.key}</Badge>
          <h1 className="text-lg font-semibold">{project.name}</h1>
          <span className="text-sm text-muted-foreground">
            {project._count.stories} stor{project._count.stories !== 1 ? "ies" : "y"}
          </span>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Story
        </Button>
      </div>

      {/* Sprint Bar (only on Sprint Board) */}
      {boardType === "SPRINT_BOARD" && <SprintBar projectId={project.id} projectKey={project.key} />}

      {/* Filter Bar */}
      <BoardFilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Kanban Board with optimistic DnD */}
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
                onAddStory={() => handleAddStory(column.id)}
                onStoryClick={(storyId) => setSelectedStoryId(storyId)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeStory ? (
            <div className="w-72 rotate-2 opacity-90">
              <TicketCard ticket={activeStory} projectKey={project.key} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateStoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={project.id}
        projectKey={project.key}
        columnId={targetColumnId ?? undefined}
      />

      <StoryDetailSheet
        storyId={selectedStoryId}
        onClose={() => setSelectedStoryId(null)}
      />
    </div>
  );
}
