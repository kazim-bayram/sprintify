"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TicketCard } from "./ticket-card";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Ticket =
  RouterOutputs["project"]["getByKey"]["boardColumns"][number]["tickets"][number];

interface SortableTicketCardProps {
  ticket: Ticket;
  projectKey: string;
  onClick?: () => void;
}

export function SortableTicketCard({ ticket, projectKey, onClick }: SortableTicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TicketCard ticket={ticket} projectKey={projectKey} onClick={onClick} />
    </div>
  );
}
