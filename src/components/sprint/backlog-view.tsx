"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Hash } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PRIORITIES } from "@/lib/constants";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ProjectWithBoard = RouterOutputs["project"]["getByKey"];

export function BacklogView({ project }: { project: ProjectWithBoard }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: sprints } = trpc.sprint.list.useQuery({ projectId: project.id });

  const updateMutation = trpc.ticket.update.useMutation({
    onSuccess: () => {
      router.refresh();
      utils.sprint.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  // All tickets without a sprint (backlog) — gathered from all columns
  const allTickets = project.boardColumns.flatMap((col) => col.tickets);
  const backlogTickets = allTickets.filter(
    (t) => !(t as Record<string, unknown>).sprintId
  );

  // Sort: priority high first, then by position
  const priorityOrder: Record<string, number> = {
    URGENT: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
    NONE: 4,
  };
  const sorted = [...backlogTickets].sort((a, b) => {
    const ap = priorityOrder[(a as Record<string, unknown>).priority as string] ?? 4;
    const bp = priorityOrder[(b as Record<string, unknown>).priority as string] ?? 4;
    if (ap !== bp) return ap - bp;
    return a.position - b.position;
  });

  const planningSprints = sprints?.filter((s) => s.status === "PLANNING") ?? [];
  const activeSprint = sprints?.find((s) => s.status === "ACTIVE");

  const totalBacklogPoints = sorted.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);

  function moveToSprint(ticketId: string, sprintId: string) {
    updateMutation.mutate({ id: ticketId, sprintId });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono">
            {project.key}
          </Badge>
          <h1 className="text-lg font-semibold">Backlog</h1>
          <span className="text-sm text-muted-foreground">
            {sorted.length} ticket{sorted.length !== 1 ? "s" : ""} · {totalBacklogPoints} pts
          </span>
        </div>
      </div>

      {/* Sprint capacity indicator */}
      {activeSprint && (
        <div className="border-b bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
          Active sprint: <strong>{activeSprint.name}</strong> ({activeSprint._count.tickets} tickets)
        </div>
      )}

      {/* Backlog list */}
      <div className="flex-1 overflow-y-auto p-6">
        {sorted.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No tickets in the backlog. All tickets are assigned to a sprint.
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((ticket) => {
              const priority = PRIORITIES.find(
                (p) => p.value === ((ticket as Record<string, unknown>).priority ?? "NONE")
              );

              return (
                <Card key={ticket.id} className="flex items-center gap-4 p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {project.key}-{ticket.number}
                      </span>
                      {priority && priority.value !== "NONE" && (
                        <Badge
                          variant={priority.color === "destructive" ? "destructive" : "secondary"}
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {priority.label}
                        </Badge>
                      )}
                      {ticket.storyPoints != null && (
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] gap-0.5">
                          <Hash className="h-2.5 w-2.5" />
                          {ticket.storyPoints}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-0.5 truncate">{ticket.title}</p>
                  </div>

                  {ticket.assignee && (
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarImage src={ticket.assignee.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[8px]">
                        {ticket.assignee.name?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Move to sprint */}
                  {(activeSprint || planningSprints.length > 0) && (
                    <Select
                      onValueChange={(sprintId) => moveToSprint(ticket.id, sprintId)}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs shrink-0">
                        <SelectValue placeholder="Add to sprint" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSprint && (
                          <SelectItem value={activeSprint.id} className="text-xs">
                            {activeSprint.name} (Active)
                          </SelectItem>
                        )}
                        {planningSprints.map((s) => (
                          <SelectItem key={s.id} value={s.id} className="text-xs">
                            {s.name} (Planning)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
