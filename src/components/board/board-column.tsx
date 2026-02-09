"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Check } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTicketCard } from "./sortable-ticket-card";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Column = RouterOutputs["project"]["getByKey"]["boardColumns"][number];

interface BoardColumnProps {
  column: Column;
  projectKey: string;
  onAddTicket: () => void;
  onTicketClick: (ticketId: string) => void;
}

export function BoardColumn({ column, projectKey, onAddTicket, onTicketClick }: BoardColumnProps) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(column.name);

  const renameMutation = trpc.project.renameColumn.useMutation({
    onSuccess: () => {
      setIsRenaming(false);
      router.refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const ticketIds = column.tickets.map((t) => t.id);

  function handleRename() {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === column.name) {
      setIsRenaming(false);
      setNewName(column.name);
      return;
    }
    renameMutation.mutate({ columnId: column.id, name: trimmed });
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-72 min-w-72 flex-col rounded-lg transition-colors ${
        isOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/50"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-6 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") {
                    setIsRenaming(false);
                    setNewName(column.name);
                  }
                }}
                onBlur={handleRename}
              />
            </div>
          ) : (
            <>
              <h3
                className="cursor-pointer truncate text-sm font-medium hover:text-primary"
                onDoubleClick={() => setIsRenaming(true)}
              >
                {column.name}
              </h3>
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
                {column.tickets.length}
              </span>
            </>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onAddTicket}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Tickets */}
      <ScrollArea className="flex-1 px-2 pb-2">
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {column.tickets.map((ticket) => (
              <SortableTicketCard
                key={ticket.id}
                ticket={ticket}
                projectKey={projectKey}
                onClick={() => onTicketClick(ticket.id)}
              />
            ))}

            {column.tickets.length === 0 && (
              <div className="flex h-24 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                Drop tickets here
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
