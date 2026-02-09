"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PRIORITIES } from "@/lib/constants";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Ticket =
  RouterOutputs["project"]["getByKey"]["boardColumns"][number]["tickets"][number];

interface TicketCardProps {
  ticket: Ticket;
  projectKey: string;
  onClick?: () => void;
}

export function TicketCard({ ticket, projectKey, onClick }: TicketCardProps) {
  const priority = PRIORITIES.find(
    (p) => p.value === ((ticket as Record<string, unknown>).priority ?? "NONE")
  );

  const assigneeInitials = ticket.assignee?.name
    ? ticket.assignee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : ticket.assignee?.email?.charAt(0).toUpperCase() ?? null;

  return (
    <Card
      className="cursor-pointer p-3 transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      {/* Priority + Story Points */}
      <div className="mb-2 flex items-center justify-between">
        {priority && priority.value !== "NONE" && (
          <Badge
            variant={priority.color === "destructive" ? "destructive" : "secondary"}
            className="px-1.5 py-0 text-[10px]"
          >
            {priority.label}
          </Badge>
        )}
        {ticket.storyPoints != null && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
            {ticket.storyPoints}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug">{ticket.title}</p>

      {/* Footer: Ticket ID + Assignee */}
      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">
          {projectKey}-{ticket.number}
        </span>

        {ticket.assignee && (
          <Avatar className="h-5 w-5">
            <AvatarImage
              src={ticket.assignee.avatarUrl ?? undefined}
              alt={ticket.assignee.name ?? ""}
            />
            <AvatarFallback className="text-[8px]">{assigneeInitials}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </Card>
  );
}
