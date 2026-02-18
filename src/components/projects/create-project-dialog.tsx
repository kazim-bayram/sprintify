"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Kanban, GanttChart, Layers, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { METHODOLOGIES, type MethodologyValue } from "@/lib/constants";

const METHODOLOGY_ICONS = { AGILE: Kanban, WATERFALL: GanttChart, HYBRID: Layers } as const;

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const programs = trpc.program.list.useQuery();
  const templatesQuery = trpc.template.list.useQuery();

  // Wizard step: 0 = methodology, 1 = details
  const [step, setStep] = useState(0);
  const [methodology, setMethodology] = useState<MethodologyValue>("AGILE");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [programId, setProgramId] = useState<string>("none");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [templateId, setTemplateId] = useState<string>("none");

  const createProject = trpc.project.create.useMutation({
    onSuccess: (project) => {
      toast.success(`Project "${project.name}" created!`);
      utils.project.list.invalidate();
      onOpenChange(false);
      resetForm();
      // Route based on methodology
      if (project.methodology === "AGILE") {
        router.push(`/projects/${project.key.toLowerCase()}/board`);
      } else {
        router.push(`/projects/${project.key.toLowerCase()}/timeline`);
      }
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setStep(0); setMethodology("AGILE"); setName(""); setKey(""); setDescription("");
    setProgramId("none"); setStartDate(""); setEndDate(""); setTemplateId("none");
  }

  function handleNameChange(value: string) {
    setName(value);
    setKey(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !key) return;
    createProject.mutate({
      name,
      key,
      methodology,
      description: description || undefined,
      programId: programId === "none" ? undefined : programId,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      templateId: templateId === "none" ? undefined : templateId,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetForm(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            {step === 0
              ? "How do you want to manage this project?"
              : "Configure your project details."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", step >= 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {step > 0 ? <Check className="h-3.5 w-3.5" /> : "1"}
          </div>
          <div className={cn("h-0.5 flex-1", step > 0 ? "bg-primary" : "bg-muted")} />
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold", step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            2
          </div>
        </div>

        {step === 0 ? (
          /* ---- STEP 0: Methodology Selection ---- */
          <div className="space-y-4">
            <div className="grid gap-3">
              {METHODOLOGIES.map((m) => {
                const Icon = METHODOLOGY_ICONS[m.value];
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMethodology(m.value)}
                    className={cn(
                      "flex items-start gap-4 rounded-lg border-2 p-4 text-left transition-all",
                      methodology === m.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/40 hover:bg-muted/50",
                    )}
                  >
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", methodology === m.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{m.label}</p>
                      <p className="text-sm text-muted-foreground">{m.description}</p>
                    </div>
                    {methodology === m.value && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(1)}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* ---- STEP 1: Project Details ---- */
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

            {/* Template selection — Waterfall & Hybrid only */}
            {(methodology === "WATERFALL" || methodology === "HYBRID") && (
              <div className="space-y-1.5">
                <Label>Workflow Template (optional)</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="No template (use generic phases)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template (generic Feasibility → Launch)</SelectItem>
                    {templatesQuery.data
                      ?.filter((tpl) => tpl.methodology === methodology)
                      .map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Templates define default phases and WBS tasks for Waterfall / Hybrid projects.
                </p>
              </div>
            )}

            {/* Date range — shown for Waterfall & Hybrid */}
            {(methodology === "WATERFALL" || methodology === "HYBRID") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="projStart">Project Start</Label>
                  <Input id="projStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="projEnd">Target Launch Date</Label>
                  <Input id="projEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="projectDesc">Description (optional)</Label>
              <Textarea id="projectDesc" placeholder="What is this NPD project about?" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>

            {/* Methodology summary badge */}
            <div className="rounded-md border bg-muted/50 p-3 text-sm">
              <span className="font-medium">Methodology:</span>{" "}
              <span className="text-primary font-semibold">{METHODOLOGIES.find((m) => m.value === methodology)?.label}</span>
              <span className="text-muted-foreground"> — {METHODOLOGIES.find((m) => m.value === methodology)?.description}</span>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" disabled={createProject.isPending || !name || !key}>
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
