"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTicketCard } from "./sortable-ticket-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/trpc/client";

interface BoardColumnProps {
  column: {
    id: string;
    name: string;
    position: number;
    wipLimit?: number | null;
    colType?: string;
    stories: any[];
  };
  projectKey: string;
  onAddStory: (columnId: string) => void;
  onStoryClick: (storyId: string) => void;
}

export function BoardColumn({ column, projectKey, onAddStory, onStoryClick }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column" } });
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(column.name);
  const utils = trpc.useUtils();
  const renameMutation = trpc.project.renameColumn.useMutation({
    onSuccess: () => { utils.project.getByKey.invalidate(); setIsRenaming(false); },
  });

  const count = column.stories.length;
  const isAtWipLimit = column.wipLimit != null && count >= column.wipLimit;
  const isOverWipLimit = column.wipLimit != null && count > column.wipLimit;

  return (
    <div className={`flex w-72 shrink-0 flex-col rounded-lg border ${isOverWipLimit ? "border-destructive/50 bg-destructive/5" : "bg-muted/40"}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        {isRenaming ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={newName} onChange={(e) => setNewName(e.target.value)} className="h-6 text-sm" autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") renameMutation.mutate({ columnId: column.id, name: newName });
                if (e.key === "Escape") setIsRenaming(false);
              }}
            />
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => renameMutation.mutate({ columnId: column.id, name: newName })}><Check className="h-3 w-3" /></Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsRenaming(false)}><X className="h-3 w-3" /></Button>
          </div>
        ) : (
          <button className="text-sm font-semibold text-muted-foreground hover:text-foreground truncate" onDoubleClick={() => setIsRenaming(true)}>
            {column.name}
          </button>
        )}
        <div className="flex items-center gap-1">
          {/* WIP indicator */}
          {column.wipLimit != null ? (
            <Badge
              variant={isOverWipLimit ? "destructive" : isAtWipLimit ? "secondary" : "outline"}
              className="px-1.5 py-0 text-[10px] gap-0.5"
            >
              {isOverWipLimit && <AlertTriangle className="h-2.5 w-2.5" />}
              {count}/{column.wipLimit}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">{count}</span>
          )}
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAddStory(column.id)}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Story list */}
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 overflow-y-auto px-2 py-2 min-h-[60px] transition-colors ${isOver ? "bg-primary/5" : ""}`}
      >
        <SortableContext items={column.stories.map((s: any) => s.id)} strategy={verticalListSortingStrategy}>
          {column.stories.map((story: any) => (
            <SortableTicketCard key={story.id} ticket={story} projectKey={projectKey} onClick={() => onStoryClick(story.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
