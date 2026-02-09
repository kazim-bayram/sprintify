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
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");

  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      toast.success(`Project "${project.name}" created!`);
      utils.project.list.invalidate();
      onOpenChange(false);
      resetForm();
      router.push(`/projects/${project.key.toLowerCase()}/board`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function resetForm() {
    setName("");
    setKey("");
    setDescription("");
  }

  function handleNameChange(value: string) {
    setName(value);
    // Auto-generate key from name (uppercase, alphanumeric, max 6 chars)
    const autoKey = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    setKey(autoKey);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !key) return;
    createProject.mutate({ name, key, description: description || undefined });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Projects contain your tickets, boards, and sprints.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              placeholder="My Awesome Project"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectKey">
              Project Key{" "}
              <span className="text-xs text-muted-foreground">
                (used in ticket IDs like {key || "KEY"}-42)
              </span>
            </Label>
            <Input
              id="projectKey"
              placeholder="PROJ"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
              required
              className="font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectDesc">Description (optional)</Label>
            <Textarea
              id="projectDesc"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
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
            <Button type="submit" disabled={createProject.isPending || !name || !key}>
              {createProject.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
