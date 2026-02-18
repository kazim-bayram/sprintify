"use client";

import { trpc } from "@/trpc/client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { METHODOLOGIES, type MethodologyValue } from "@/lib/constants";
import { Plus, Trash2, Pencil, Save, X, ClipboardList } from "lucide-react";

export function TemplateEngine() {
  const utils = trpc.useUtils();
  const templatesQuery = trpc.template.list.useQuery();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const createTemplate = trpc.template.create.useMutation({
    onSuccess: (tpl) => {
      toast.success("Template created!");
      utils.template.list.invalidate();
      setSelectedTemplateId(tpl.id);
      setNewName("");
      setNewDescription("");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTemplate = trpc.template.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted.");
      utils.template.list.invalidate();
      setSelectedTemplateId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // New template form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newMethodology, setNewMethodology] = useState<MethodologyValue>("WATERFALL");

  const selectedTemplate = templatesQuery.data?.find((t) => t.id === selectedTemplateId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          Template Engine
        </h1>
        <p className="text-sm text-muted-foreground">
          Define reusable Waterfall / Hybrid blueprints with phases and default tasks.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        {/* Left: Template list + create form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Templates</CardTitle>
              <CardDescription>
                Select a template to edit its phases and tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[360px] overflow-y-auto">
              {templatesQuery.data?.length ? (
                templatesQuery.data.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      selectedTemplateId === tpl.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{tpl.name}</span>
                      {tpl.description && (
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {tpl.description}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {tpl.methodology}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {tpl._count.phases} phase{tpl._count.phases === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No templates yet. Create your first blueprint below.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Create Template</CardTitle>
              <CardDescription>
                Start from a clean slate. You can add phases and tasks afterwards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="tplName">Name</Label>
                <Input
                  id="tplName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Product Launch (Waterfall)"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tplMethodology">Methodology</Label>
                <Select
                  value={newMethodology}
                  onValueChange={(v) => setNewMethodology(v as MethodologyValue)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODOLOGIES.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tplDesc">Description</Label>
                <Textarea
                  id="tplDesc"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  placeholder="Short description of this workflow template..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() =>
                    createTemplate.mutate({
                      name: newName.trim(),
                      description: newDescription || undefined,
                      methodology: newMethodology,
                    })
                  }
                  disabled={createTemplate.isPending || !newName.trim()}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {createTemplate.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {selectedTemplate && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                if (confirm("Delete this template and all its phases/tasks?")) {
                  deleteTemplate.mutate({ id: selectedTemplate.id });
                }
              }}
              disabled={deleteTemplate.isPending}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete Template
            </Button>
          )}
        </div>

        {/* Right: Phase + task editor */}
        <div>
          {selectedTemplate ? (
            <TemplateEditor templateId={selectedTemplate.id} />
          ) : (
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-base">Template Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Select a template on the left to configure its phases and default tasks.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateEditor({ templateId }: { templateId: string }) {
  const utils = trpc.useUtils();
  const templateQuery = trpc.template.getById.useQuery({ id: templateId });

  const addPhase = trpc.template.addPhase.useMutation({
    onSuccess: () => {
      toast.success("Phase added!");
      utils.template.getById.invalidate({ id: templateId });
    },
    onError: (err) => toast.error(err.message),
  });

  const updatePhase = trpc.template.updatePhase.useMutation({
    onSuccess: () => {
      toast.success("Phase updated!");
      utils.template.getById.invalidate({ id: templateId });
      setEditingPhaseId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deletePhase = trpc.template.deletePhase.useMutation({
    onSuccess: () => {
      toast.success("Phase deleted.");
      utils.template.getById.invalidate({ id: templateId });
    },
    onError: (err) => toast.error(err.message),
  });

  const addTask = trpc.template.addTask.useMutation({
    onSuccess: () => {
      toast.success("Task added!");
      utils.template.getById.invalidate({ id: templateId });
      setNewTaskName("");
      setNewTaskDuration("");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateTask = trpc.template.updateTask.useMutation({
    onSuccess: () => {
      toast.success("Task updated!");
      utils.template.getById.invalidate({ id: templateId });
      setEditingTaskId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTask = trpc.template.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Task deleted.");
      utils.template.getById.invalidate({ id: templateId });
    },
    onError: (err) => toast.error(err.message),
  });

  const [newPhaseName, setNewPhaseName] = useState("");
  const [newPhaseColor, setNewPhaseColor] = useState("#3B82F6");
  const [newPhaseIsGate, setNewPhaseIsGate] = useState(false);

  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editPhaseName, setEditPhaseName] = useState("");
  const [editPhaseColor, setEditPhaseColor] = useState("#3B82F6");
  const [editPhaseIsGate, setEditPhaseIsGate] = useState(false);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskDuration, setNewTaskDuration] = useState("");
  const [newTaskPhaseId, setNewTaskPhaseId] = useState<string>(""); // target phase
  const [newTaskIsMilestone, setNewTaskIsMilestone] = useState(false);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskDuration, setEditTaskDuration] = useState("");
  const [editTaskIsMilestone, setEditTaskIsMilestone] = useState(false);

  if (templateQuery.isLoading || !templateQuery.data) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading template...
        </CardContent>
      </Card>
    );
  }

  const tpl = templateQuery.data;

  function handleAddPhase() {
    if (!newPhaseName.trim()) return;
    addPhase.mutate({
      templateId,
      name: newPhaseName.trim(),
      color: newPhaseColor,
      isGate: newPhaseIsGate,
    });
  }

  function startEditPhase(phase: (typeof tpl.phases)[number]) {
    setEditingPhaseId(phase.id);
    setEditPhaseName(phase.name);
    setEditPhaseColor(phase.color);
    setEditPhaseIsGate(phase.isGate);
  }

  function savePhase() {
    if (!editingPhaseId || !editPhaseName.trim()) return;
    updatePhase.mutate({
      id: editingPhaseId,
      name: editPhaseName.trim(),
      color: editPhaseColor,
      isGate: editPhaseIsGate,
    });
  }

  function startEditTask(task: { id: string; name: string; duration: number; isMilestone: boolean }) {
    setEditingTaskId(task.id);
    setEditTaskName(task.name);
    setEditTaskDuration(task.duration ? String(task.duration) : "");
    setEditTaskIsMilestone(task.isMilestone);
  }

  function saveTask() {
    if (!editingTaskId || !editTaskName.trim()) return;
    updateTask.mutate({
      id: editingTaskId,
      name: editTaskName.trim(),
      duration: editTaskDuration ? parseFloat(editTaskDuration) : 0,
      isMilestone: editTaskIsMilestone,
    });
  }

  function handleAddTask() {
    if (!newTaskName.trim() || !newTaskPhaseId) return;
    addTask.mutate({
      phaseId: newTaskPhaseId,
      name: newTaskName.trim(),
      duration: newTaskDuration ? parseFloat(newTaskDuration) : 0,
      isMilestone: newTaskIsMilestone,
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Phases & Tasks
            <Badge variant="outline" className="text-[11px]">
              {tpl.methodology} template
            </Badge>
          </CardTitle>
          <CardDescription>
            Define the stage-gate phases and default WBS tasks for this template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phase table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead className="w-32">Color</TableHead>
                <TableHead className="w-28">Gate?</TableHead>
                <TableHead className="w-24">Tasks</TableHead>
                <TableHead className="w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tpl.phases.map((phase, idx) => (
                <TableRow key={phase.id}>
                  <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    {editingPhaseId === phase.id ? (
                      <Input
                        value={editPhaseName}
                        onChange={(e) => setEditPhaseName(e.target.value)}
                        className="h-8 text-sm"
                      />
                    ) : (
                      <span className="font-medium">{phase.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingPhaseId === phase.id ? (
                      <Input
                        type="color"
                        value={editPhaseColor}
                        onChange={(e) => setEditPhaseColor(e.target.value)}
                        className="h-8 w-16 p-1"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border"
                          style={{ backgroundColor: phase.color }}
                        />
                        <span className="text-xs text-muted-foreground">{phase.color}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingPhaseId === phase.id ? (
                      <Select
                        value={editPhaseIsGate ? "yes" : "no"}
                        onValueChange={(v) => setEditPhaseIsGate(v === "yes")}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : phase.isGate ? (
                      <Badge variant="secondary" className="text-[10px]">
                        Stage Gate
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Execution</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {phase.tasks.length} task{phase.tasks.length === 1 ? "" : "s"}
                  </TableCell>
                  <TableCell>
                    {editingPhaseId === phase.id ? (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={savePhase}
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => setEditingPhaseId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => startEditPhase(phase)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => deletePhase.mutate({ id: phase.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Add phase form */}
          <div className="mt-4 grid gap-3 rounded-md border bg-muted/40 p-3 md:grid-cols-[2fr_1fr_1fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs">Phase Name</Label>
              <Input
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                placeholder="e.g., Feasibility, Lab Tests, Launch"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Color</Label>
              <Input
                type="color"
                value={newPhaseColor}
                onChange={(e) => setNewPhaseColor(e.target.value)}
                className="h-9 w-16 p-1"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Stage Gate?</Label>
              <Select
                value={newPhaseIsGate ? "yes" : "no"}
                onValueChange={(v) => setNewPhaseIsGate(v === "yes")}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-end">
              <Button
                size="sm"
                onClick={handleAddPhase}
                disabled={addPhase.isPending || !newPhaseName.trim()}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Phase
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Default Tasks / Milestones</CardTitle>
          <CardDescription>
            These tasks will become initial WBS items when a project is created from this template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Task</TableHead>
                <TableHead className="w-40">Phase</TableHead>
                <TableHead className="w-32">Duration (days)</TableHead>
                <TableHead className="w-24">Milestone</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tpl.phases.flatMap((phase, phaseIdx) =>
                phase.tasks.map((task, taskIdx) => {
                  const idx = `${phaseIdx + 1}.${taskIdx + 1}`;
                  const isEditing = editingTaskId === task.id;
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="text-muted-foreground text-xs">{idx}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editTaskName}
                            onChange={(e) => setEditTaskName(e.target.value)}
                            className="h-8 text-sm"
                          />
                        ) : (
                          <span className="text-sm font-medium">{task.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{phase.name}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={editTaskDuration}
                            onChange={(e) => setEditTaskDuration(e.target.value)}
                            className="h-8 w-24 text-sm"
                          />
                        ) : (
                          <span className="text-xs">
                            {task.duration ? `${task.duration} d` : "0"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select
                            value={editTaskIsMilestone ? "yes" : "no"}
                            onValueChange={(v) => setEditTaskIsMilestone(v === "yes")}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no">No</SelectItem>
                              <SelectItem value="yes">Yes</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : task.isMilestone ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Milestone
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Normal</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={saveTask}
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditingTaskId(null)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() =>
                                startEditTask({
                                  id: task.id,
                                  name: task.name,
                                  duration: task.duration,
                                  isMilestone: task.isMilestone,
                                })
                              }
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteTask.mutate({ id: task.id })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                }),
              )}
            </TableBody>
          </Table>

          {/* Add task form */}
          <div className="mt-4 grid gap-3 rounded-md border bg-muted/40 p-3 md:grid-cols-[2fr_1.2fr_1fr_1fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs">Task Name</Label>
              <Input
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder='e.g., "Complete Lab Stability Tests"'
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phase</Label>
              <Select value={newTaskPhaseId} onValueChange={setNewTaskPhaseId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {tpl.phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Duration (days)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={newTaskDuration}
                onChange={(e) => setNewTaskDuration(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Milestone?</Label>
              <Select
                value={newTaskIsMilestone ? "yes" : "no"}
                onValueChange={(v) => setNewTaskIsMilestone(v === "yes")}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-end">
              <Button
                size="sm"
                onClick={handleAddTask}
                disabled={addTask.isPending || !newTaskName.trim() || !newTaskPhaseId}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Task
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

