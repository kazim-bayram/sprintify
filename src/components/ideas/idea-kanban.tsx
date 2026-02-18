"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Lightbulb } from "lucide-react";
import { useState } from "react";
import { IdeaCard } from "./idea-card";
import { CreateEditIdeaDialog } from "./create-edit-idea-dialog";
import { IdeaDetailSheet } from "./idea-detail-sheet";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Idea = RouterOutputs["idea"]["list"][number];

const STATUS_COLUMNS: Array<{ status: Idea["status"]; label: string }> = [
  { status: "DRAFT", label: "Draft" },
  { status: "REVIEW", label: "In Review" },
  { status: "APPROVED", label: "Approved" },
  { status: "REJECTED", label: "Rejected" },
];

interface IdeaKanbanProps {
  initialIdeas: Idea[];
}

function SortableIdeaCard({
  idea,
  onClick,
}: {
  idea: Idea;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: idea.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <IdeaCard idea={idea} onClick={onClick} />
    </div>
  );
}

function DroppableColumn({
  status,
  label,
  ideas,
  onIdeaClick,
}: {
  status: Idea["status"];
  label: string;
  ideas: Idea[];
  onIdeaClick: (ideaId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "column", status },
  });

  const sortableIds = ideas.map((i) => i.id);

  return (
    <div ref={setNodeRef} className="flex w-72 shrink-0 flex-col">
      {/* Column Header */}
      <div className={`mb-3 flex items-center justify-between p-2 rounded-lg transition-colors ${isOver ? "bg-primary/10" : ""}`}>
        <h2 className="text-sm font-semibold text-muted-foreground">{label}</h2>
        <Badge variant="secondary" className="text-xs">
          {ideas.length}
        </Badge>
      </div>

      {/* Ideas List */}
      <div className="flex-1 space-y-3 min-h-[200px]">
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {ideas.map((idea) => (
            <SortableIdeaCard key={idea.id} idea={idea} onClick={() => onIdeaClick(idea.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function IdeaKanban({ initialIdeas }: IdeaKanbanProps) {
  const utils = trpc.useUtils();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [activeIdea, setActiveIdea] = useState<Idea | null>(null);

  const { data: ideas = initialIdeas } = trpc.idea.list.useQuery(undefined, {
    initialData: initialIdeas,
  });

  const updateStatusMutation = trpc.idea.updateStatus.useMutation({
    onSuccess: () => {
      utils.idea.list.invalidate();
    },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Group ideas by status
  const ideasByStatus = ideas.reduce(
    (acc, idea) => {
      if (!acc[idea.status]) acc[idea.status] = [];
      acc[idea.status].push(idea);
      return acc;
    },
    {} as Record<Idea["status"], Idea[]>
  );

  const handleDragStart = (event: DragStartEvent) => {
    const ideaId = event.active.id as string;
    const idea = ideas.find((i) => i.id === ideaId);
    if (idea) setActiveIdea(idea);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIdea(null);
    const { active, over } = event;
    if (!over) return;

    const ideaId = active.id as string;
    const targetStatus = over.id as Idea["status"];

    // Find the idea
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea || idea.status === targetStatus) return;

    // Prevent moving APPROVED ideas that are linked to projects
    if (idea.status === "APPROVED" && idea.linkedProjectId) {
      return;
    }

    updateStatusMutation.mutate({ id: ideaId, status: targetStatus });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Idea Portal</h1>
          <Badge variant="outline" className="text-xs">
            {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
          </Badge>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Idea
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="flex-1">
          <div className="flex gap-4 p-6">
            {STATUS_COLUMNS.map((column) => {
              const columnIdeas = ideasByStatus[column.status] ?? [];
              return (
                <DroppableColumn
                  key={column.status}
                  status={column.status}
                  label={column.label}
                  ideas={columnIdeas}
                  onIdeaClick={(ideaId) => setSelectedIdeaId(ideaId)}
                />
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <DragOverlay>
          {activeIdea && <IdeaCard idea={activeIdea} />}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <CreateEditIdeaDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      {selectedIdeaId && (
        <IdeaDetailSheet
          ideaId={selectedIdeaId}
          open={!!selectedIdeaId}
          onOpenChange={(open) => {
            if (!open) setSelectedIdeaId(null);
          }}
        />
      )}
    </div>
  );
}
