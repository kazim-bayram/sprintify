"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface SprintRolloverModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sprintId: string;
  sprintName: string;
  projectId: string;
}

type Decision = "NEXT_SPRINT" | "BACKLOG";

export function SprintRolloverModal({
  open,
  onOpenChange,
  sprintId,
  sprintName,
  projectId,
}: SprintRolloverModalProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const { data: incompleteTickets, isLoading } = trpc.sprint.getIncompleteTickets.useQuery(
    { sprintId },
    { enabled: open }
  );

  const closeMutation = trpc.sprint.close.useMutation();
  const rolloverMutation = trpc.sprint.rollover.useMutation();

  async function handleCloseSprint() {
    try {
      // First close the sprint
      await closeMutation.mutateAsync({ id: sprintId });

      // Then rollover if there are incomplete tickets
      if (incompleteTickets && incompleteTickets.length > 0) {
        const ticketDecisions = incompleteTickets.map((t) => ({
          ticketId: t.id,
          action: decisions[t.id] ?? ("BACKLOG" as Decision),
        }));
        await rolloverMutation.mutateAsync({ sprintId, decisions: ticketDecisions });
      }

      // Celebrate!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      toast.success(`${sprintName} closed!`);
      utils.sprint.invalidate();
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error("Failed to close sprint");
    }
  }

  const allDecided =
    !incompleteTickets || incompleteTickets.every((t) => decisions[t.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Close {sprintName}</DialogTitle>
          <DialogDescription>
            {!incompleteTickets || incompleteTickets.length === 0
              ? "All tickets are done! Ready to close."
              : `${incompleteTickets.length} incomplete ticket${incompleteTickets.length !== 1 ? "s" : ""}. Decide what happens to each one.`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading tickets...</p>
        ) : incompleteTickets && incompleteTickets.length > 0 ? (
          <div className="max-h-80 overflow-y-auto space-y-3">
            {incompleteTickets.map((ticket) => (
              <div key={ticket.id} className="flex items-center gap-3 rounded-md border p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ticket.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {ticket.assignee && (
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={ticket.assignee.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[8px]">
                          {ticket.assignee.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {ticket.storyPoints != null && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {ticket.storyPoints} pts
                      </Badge>
                    )}
                  </div>
                </div>
                <Select
                  value={decisions[ticket.id] ?? ""}
                  onValueChange={(v) =>
                    setDecisions((prev) => ({ ...prev, [ticket.id]: v as Decision }))
                  }
                >
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Choose..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEXT_SPRINT" className="text-xs">
                      Move to Next Sprint
                    </SelectItem>
                    <SelectItem value="BACKLOG" className="text-xs">
                      Move to Backlog
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-green-600 text-center py-4">
            All tickets completed! Great work.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCloseSprint}
            disabled={
              closeMutation.isPending ||
              rolloverMutation.isPending ||
              (incompleteTickets && incompleteTickets.length > 0 && !allDecided)
            }
          >
            {closeMutation.isPending || rolloverMutation.isPending
              ? "Closing..."
              : "Close Sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
