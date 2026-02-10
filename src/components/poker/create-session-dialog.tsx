"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectKey: string;
}

export function CreateSessionDialog({ open, onOpenChange, projectId, projectKey }: CreateSessionDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(`${projectKey} Estimation`);

  const createSession = trpc.poker.createSession.useMutation({
    onSuccess: (session) => {
      toast.success(`Session created! Code: ${session.accessCode}`);
      onOpenChange(false);
      router.push(`/poker/${session.accessCode}`);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Planning Poker</DialogTitle>
          <DialogDescription>
            Create a real-time estimation session for {projectKey}. Share the access code with your team.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createSession.mutate({ projectId, name: name.trim() || `${projectKey} Estimation` });
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="sessionName">Session Name</Label>
            <Input
              id="sessionName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 5 Estimation"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? "Creating..." : "Start Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
