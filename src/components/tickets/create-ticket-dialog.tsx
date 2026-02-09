"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PRIORITIES, STORY_POINTS } from "@/lib/constants";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectKey: string;
  columnId?: string;
}

export function CreateTicketDialog({
  open,
  onOpenChange,
  projectId,
  projectKey,
  columnId,
}: CreateTicketDialogProps) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NONE");
  const [storyPoints, setStoryPoints] = useState<string>("none");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");

  const members = trpc.member.list.useQuery();

  const createTicket = trpc.ticket.create.useMutation({
    onSuccess: (ticket) => {
      toast.success(`${projectKey}-${ticket.number} created!`);
      onOpenChange(false);
      resetForm();
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("NONE");
    setStoryPoints("none");
    setAssigneeId("unassigned");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    createTicket.mutate({
      projectId,
      title,
      description: description || undefined,
      columnId,
      priority,
      storyPoints: storyPoints === "none" ? null : parseInt(storyPoints),
      assigneeId: assigneeId === "unassigned" ? undefined : assigneeId,
    });
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Ticket</DialogTitle>
          <DialogDescription>Add a new ticket to {projectKey}.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ticketTitle">Title</Label>
            <Input
              ref={titleRef}
              id="ticketTitle"
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticketDesc">Description (optional)</Label>
            <Textarea
              id="ticketDesc"
              placeholder="Add more detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Priority + Story Points row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Story Points</Label>
              <Select value={storyPoints} onValueChange={setStoryPoints}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {STORY_POINTS.map((sp) => (
                    <SelectItem key={sp} value={sp.toString()}>
                      {sp} pt{sp !== 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-1.5">
            <Label>Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {members.data?.map((m) => (
                  <SelectItem key={m.user.id} value={m.user.id}>
                    {m.user.name ?? m.user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTicket.isPending || !title}>
              {createTicket.isPending ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
