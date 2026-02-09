"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITIES, STORY_POINTS, TICKET_STATUSES } from "@/lib/constants";
import { User, Flag, Hash, Circle } from "lucide-react";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TicketDetail = RouterOutputs["ticket"]["getById"];

interface TicketSidebarProps {
  ticket: TicketDetail;
}

export function TicketSidebar({ ticket }: TicketSidebarProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const members = trpc.member.list.useQuery();

  const updateMutation = trpc.ticket.update.useMutation({
    onSuccess: () => {
      utils.ticket.getById.invalidate({ id: ticket.id });
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  function update(data: Record<string, unknown>) {
    updateMutation.mutate({ id: ticket.id, ...data });
  }

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {/* Status */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Circle className="h-3 w-3" /> Status
        </label>
        <Select value={ticket.status} onValueChange={(v) => update({ status: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TICKET_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Flag className="h-3 w-3" /> Priority
        </label>
        <Select value={ticket.priority} onValueChange={(v) => update({ priority: v })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value} className="text-xs">
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignee */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <User className="h-3 w-3" /> Assignee
        </label>
        <Select
          value={ticket.assigneeId ?? "unassigned"}
          onValueChange={(v) => update({ assigneeId: v === "unassigned" ? null : v })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unassigned" className="text-xs">
              Unassigned
            </SelectItem>
            {members.data?.map((m) => (
              <SelectItem key={m.user.id} value={m.user.id} className="text-xs">
                <span className="flex items-center gap-2">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={m.user.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[8px]">
                      {m.user.name?.charAt(0) ?? m.user.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {m.user.name ?? m.user.email}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Story Points */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hash className="h-3 w-3" /> Story Points
        </label>
        <Select
          value={ticket.storyPoints?.toString() ?? "none"}
          onValueChange={(v) => update({ storyPoints: v === "none" ? null : parseInt(v) })}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="None" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="text-xs">
              None
            </SelectItem>
            {STORY_POINTS.map((sp) => (
              <SelectItem key={sp} value={sp.toString()} className="text-xs">
                {sp} point{sp !== 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reporter (read-only) */}
      <div className="col-span-2 space-y-1">
        <span className="text-xs text-muted-foreground">Reporter</span>
        <div className="flex items-center gap-2 text-xs">
          <Avatar className="h-5 w-5">
            <AvatarImage src={ticket.reporter.avatarUrl ?? undefined} />
            <AvatarFallback className="text-[8px]">
              {ticket.reporter.name?.charAt(0) ?? ticket.reporter.email.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span>{ticket.reporter.name ?? ticket.reporter.email}</span>
        </div>
      </div>
    </div>
  );
}
