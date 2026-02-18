"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TicketCard } from "./ticket-card";

interface SortableTicketCardProps {
  ticket: any;
  projectKey: string;
  methodology: "AGILE" | "WATERFALL" | "HYBRID";
  onClick?: () => void;
}

export function SortableTicketCard({
  ticket,
  projectKey,
  methodology,
  onClick,
}: SortableTicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: "story", story: ticket },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard
        ticket={ticket}
        projectKey={projectKey}
        methodology={methodology}
        onClick={onClick}
      />
    </div>
  );
}
