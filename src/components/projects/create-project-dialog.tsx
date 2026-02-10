"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const programs = trpc.program.list.useQuery();

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState<string>("none");

  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      toast.success(`Project "${project.name}" created!`);
      utils.project.list.invalidate();
      onOpenChange(false);
      resetForm();
      router.push(`/projects/${project.key.toLowerCase()}/board`);
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() { setName(""); setKey(""); setDescription(""); setProgramId("none"); }

  function handleNameChange(value: string) {
    setName(value);
    setKey(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !key) return;
    createProject.mutate({
      name, key,
      description: description || undefined,
      programId: programId === "none" ? undefined : programId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Projects contain your stories, boards, and sprints for NPD.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="projectName">Project Name</Label>
            <Input id="projectName" placeholder="New Protein Bar Launch" value={name} onChange={(e) => handleNameChange(e.target.value)} required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="projectKey">Key <span className="text-xs text-muted-foreground">(used in story IDs like {key || "KEY"}-42)</span></Label>
            <Input id="projectKey" placeholder="PROTBAR" value={key} onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10))} required className="font-mono uppercase" />
          </div>
          <div className="space-y-1.5">
            <Label>Program (Brand / Category)</Label>
            <Select value={programId} onValueChange={setProgramId}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {programs.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="projectDesc">Description (optional)</Label>
            <Textarea id="projectDesc" placeholder="What is this NPD project about?" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" disabled={createProject.isPending || !name || !key}>{createProject.isPending ? "Creating..." : "Create Project"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
