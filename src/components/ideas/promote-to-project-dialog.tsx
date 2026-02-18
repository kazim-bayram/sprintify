"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/trpc/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";

interface PromoteToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId: string;
  ideaTitle: string;
}

export function PromoteToProjectDialog({
  open,
  onOpenChange,
  ideaId,
  ideaTitle,
}: PromoteToProjectDialogProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const programs = trpc.program.list.useQuery();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState<string>("none");
  const [methodology, setMethodology] = useState<"AGILE" | "WATERFALL" | "HYBRID">("WATERFALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const promoteMutation = trpc.idea.promoteToProject.useMutation({
    onSuccess: (project) => {
      toast.success(`Project "${project.name}" created from idea!`);
      utils.idea.list.invalidate();
      utils.idea.getById.invalidate({ id: ideaId });
      utils.project.list.invalidate();
      onOpenChange(false);
      // Redirect to the new project
      router.push(`/projects/${project.key.toLowerCase()}/timeline`);
    },
    onError: (err) => toast.error(err.message),
  });

  // Auto-generate name and key from idea title when dialog opens
  useEffect(() => {
    if (open && ideaTitle && !name) {
      setName(ideaTitle);
      const generatedKey = ideaTitle
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
      setKey(generatedKey);
    }
  }, [open, ideaTitle, name]);

  function handleNameChange(value: string) {
    setName(value);
    if (!key || key === ideaTitle.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)) {
      setKey(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !key) return;

    promoteMutation.mutate({
      ideaId,
      name,
      key,
      description: description || undefined,
      programId: programId === "none" ? undefined : programId,
      methodology,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Promote Idea to Project
          </DialogTitle>
          <DialogDescription>
            Convert this approved idea into a project. The idea will be linked to the project for traceability.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Idea</p>
            <p className="text-sm font-medium">{ideaTitle}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input
              id="projectName"
              placeholder="New Project Name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projectKey">
              Key * <span className="text-xs text-muted-foreground">(used in story IDs like {key || "KEY"}-42)</span>
            </Label>
            <Input
              id="projectKey"
              placeholder="PROJECT"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))}
              required
              className="font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Project description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Methodology</Label>
              <Select value={methodology} onValueChange={(v) => setMethodology(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WATERFALL">Waterfall</SelectItem>
                  <SelectItem value="AGILE">Agile</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Program (Team / Initiative)</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {programs.data?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(methodology === "WATERFALL" || methodology === "HYBRID") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={promoteMutation.isPending}>
              <Rocket className="h-4 w-4 mr-2" />
              {promoteMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
