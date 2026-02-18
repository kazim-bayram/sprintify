"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PRIORITIES, STORY_POINTS, DEPARTMENTS, WSJF_SCALE, calculateWSJF } from "@/lib/constants";
import { useProjectTerminology } from "@/hooks/use-project-terminology";
import type { MethodologyValue } from "@/lib/constants";

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectKey: string;
  boardType: "SPRINT_BOARD" | "GLOBAL_PRODUCT_BACKLOG";
  methodology: MethodologyValue;
  columnId?: string;
}

export function CreateStoryDialog({
  open,
  onOpenChange,
  projectId,
  projectKey,
  boardType,
  methodology,
  columnId,
}: CreateStoryDialogProps) {
  const router = useRouter();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NONE");
  const [department, setDepartment] = useState<string>("none");
  const [storyPoints, setStoryPoints] = useState<string>("none");
  const [assigneeId, setAssigneeId] = useState<string>("unassigned");
  const [userBusinessValue, setUserBusinessValue] = useState("0");
  const [timeCriticality, setTimeCriticality] = useState("0");
  const [riskReduction, setRiskReduction] = useState("0");
  const [jobSize, setJobSize] = useState("1");
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});

  const terminology = useProjectTerminology(methodology);
  const isWaterfall = terminology.isWaterfall;
  const isAgile = terminology.isAgile;
  const isHybrid = terminology.isHybrid;

  // Waterfall / Hybrid scheduling (stored into customValues)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationDays, setDurationDays] = useState("");

  const members = trpc.member.list.useQuery();
  const fieldDefs = trpc.admin.listFields.useQuery();
  const utils = trpc.useUtils();

  const createStory = trpc.story.create.useMutation({
    async onMutate(variables) {
      await utils.project.getByKey.cancel({ key: projectKey, boardType });
      const previous = utils.project.getByKey.getData({ key: projectKey, boardType });
      if (!previous) return { previousProject: null as unknown };

      const targetColumnId = variables.columnId ?? previous.boardColumns[0]?.id;
      if (!targetColumnId) return { previousProject: previous };

      const tempId = `temp-${Date.now()}`;
      const optimisticStory: any = {
        id: tempId,
        number: previous.storyCounter + 1,
        title: variables.title,
        description: variables.description ?? null,
        status: "BACKLOG",
        priority: variables.priority,
        department: variables.department,
        position: 0,
        storyPoints: variables.storyPoints ?? null,
        userBusinessValue: variables.userBusinessValue,
        timeCriticality: variables.timeCriticality,
        riskReduction: variables.riskReduction,
        jobSize: variables.jobSize,
        assignee: null,
        feature: null,
        labels: [],
        checklists: [],
        _count: { tasks: 0 },
        phase: null,
        sprint: null,
      };

      const nextProject: typeof previous = {
        ...previous,
        boardColumns: previous.boardColumns.map((col) =>
          col.id === targetColumnId
            ? { ...col, stories: [...col.stories, optimisticStory] }
            : col,
        ),
        _count: { ...previous._count, stories: previous._count.stories + 1 },
      };

      utils.project.getByKey.setData({ key: projectKey, boardType }, nextProject);

      return { previousProject: previous };
    },
    onSuccess: (story) => {
      toast.success(`${projectKey}-${story.number} created!`);
      onOpenChange(false);
      resetForm();
      router.refresh();
    },
    onError: (err, _variables, context) => {
      if (context?.previousProject) {
        utils.project.getByKey.setData(
          { key: projectKey, boardType },
          context.previousProject as any,
        );
      }
      toast.error(err.message);
    },
    onSettled: () => {
      utils.project.getByKey.invalidate({ key: projectKey, boardType });
    },
  });

  function resetForm() {
    setTitle(""); setDescription(""); setPriority("NONE"); setDepartment("none");
    setStoryPoints("none"); setAssigneeId("unassigned");
    setUserBusinessValue("0"); setTimeCriticality("0"); setRiskReduction("0"); setJobSize("1");
    setCustomValues({});
    setStartDate(""); setEndDate(""); setDurationDays("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;

    // Validate required custom fields
    const fields = fieldDefs.data ?? [];
    for (const field of fields) {
      if (field.isRequired && !customValues[field.fieldKey]) {
        toast.error(`"${field.name}" is required.`);
        return;
      }
    }

    const baseCustomValues: Record<string, unknown> = { ...customValues };

    if (isWaterfall || isHybrid) {
      if (startDate) baseCustomValues["schedule_start"] = startDate;
      if (endDate) baseCustomValues["schedule_end"] = endDate;
      if (durationDays) baseCustomValues["schedule_duration_days"] = Number(durationDays) || null;
    }

    createStory.mutate({
      projectId, title,
      description: description || undefined,
      columnId, priority,
      department: department === "none" ? null : department,
      storyPoints: isWaterfall ? null : storyPoints === "none" ? null : parseInt(storyPoints),
      assigneeId: assigneeId === "unassigned" ? undefined : assigneeId,
      userBusinessValue: isWaterfall ? 0 : parseInt(userBusinessValue),
      timeCriticality: isWaterfall ? 0 : parseInt(timeCriticality),
      riskReduction: isWaterfall ? 0 : parseInt(riskReduction),
      jobSize: isWaterfall ? 1 : parseInt(jobSize) || 1,
      customValues: Object.keys(baseCustomValues).length > 0 ? baseCustomValues : undefined,
    });
  }

  useEffect(() => { if (open) setTimeout(() => titleRef.current?.focus(), 100); }, [open]);

  const wsjf = isWaterfall
    ? 0
    : calculateWSJF(
        parseInt(userBusinessValue),
        parseInt(timeCriticality),
        parseInt(riskReduction),
        parseInt(jobSize) || 1,
      );

  function setCustomField(key: string, value: unknown) {
    setCustomValues((prev) => ({ ...prev, [key]: value }));
  }

  const fields = fieldDefs.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {terminology.ticketSingular}</DialogTitle>
          <DialogDescription>
            Add a new {terminology.ticketSingular.toLowerCase()} to {projectKey}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="storyTitle">Title</Label>
            <Input
              ref={titleRef}
              id="storyTitle"
              placeholder={
                isWaterfall ? "Describe the task to be delivered..." : "As [role], I need to..."
              }
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="storyDesc">Description (optional)</Label>
            <Textarea id="storyDesc" placeholder="Acceptance criteria, context..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          {/* Department + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {DEPARTMENTS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Effort + Assignee */}
          <div className="grid grid-cols-2 gap-3">
            {!isWaterfall && (
              <div className="space-y-1.5">
                <Label>{terminology.effortLabel}</Label>
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
            )}
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members.data?.map((m) => <SelectItem key={m.user.id} value={m.user.id}>{m.user.name ?? m.user.email}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* WSJF Scoring */}
          {!isWaterfall && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">WSJF Prioritization</span>
                {wsjf > 0 && (
                  <span className="text-sm font-bold text-primary">Score: {wsjf}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Business Value</Label>
                  <Select value={userBusinessValue} onValueChange={setUserBusinessValue}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      {WSJF_SCALE.map((v) => (
                        <SelectItem key={v} value={v.toString()}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Time Criticality</Label>
                  <Select value={timeCriticality} onValueChange={setTimeCriticality}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      {WSJF_SCALE.map((v) => (
                        <SelectItem key={v} value={v.toString()}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Risk Reduction</Label>
                  <Select value={riskReduction} onValueChange={setRiskReduction}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      {WSJF_SCALE.map((v) => (
                        <SelectItem key={v} value={v.toString()}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                WSJF = (Value + Criticality + Risk) / Job Size
              </p>
            </div>
          )}

          {/* Waterfall / Hybrid scheduling */}
          {(isWaterfall || isHybrid) && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required={isWaterfall}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  className="h-9 text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required={isWaterfall}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Duration (days)</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-sm"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="Auto / est."
                />
              </div>
            </div>
          )}

          {/* Dynamic Custom Fields from FieldDefinitions */}
          {fields.length > 0 && (
            <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-3">
              <span className="text-xs font-semibold">Custom Fields</span>
              <div className="grid grid-cols-2 gap-3">
                {fields.map((field) => (
                  <CustomFieldInput
                    key={field.id}
                    field={field}
                    value={customValues[field.fieldKey]}
                    onChange={(val) => setCustomField(field.fieldKey, val)}
                    members={members.data}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" disabled={createStory.isPending || !title}>{createStory.isPending ? "Creating..." : "Create Story"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Render a single custom field input based on FieldDefinition type */
function CustomFieldInput({
  field, value, onChange, members,
}: {
  field: { id: string; name: string; fieldKey: string; type: string; options: string[]; isRequired: boolean };
  value: unknown;
  onChange: (val: unknown) => void;
  members?: { user: { id: string; name: string | null; email: string } }[];
}) {
  const label = field.name + (field.isRequired ? " *" : "");

  switch (field.type) {
    case "TEXT":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{label}</Label>
          <Input value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={field.name} className="h-9 text-sm" />
        </div>
      );
    case "NUMBER":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{label}</Label>
          <Input type="number" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} placeholder="0" className="h-9 text-sm" />
        </div>
      );
    case "SELECT":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{label}</Label>
          <Select value={(value as string) ?? "__none"} onValueChange={(v) => onChange(v === "__none" ? null : v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">None</SelectItem>
              {field.options.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    case "DATE":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{label}</Label>
          <Input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || null)} className="h-9 text-sm" />
        </div>
      );
    case "USER":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{label}</Label>
          <Select value={(value as string) ?? "__none"} onValueChange={(v) => onChange(v === "__none" ? null : v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select user..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">None</SelectItem>
              {members?.map((m) => <SelectItem key={m.user.id} value={m.user.id}>{m.user.name ?? m.user.email}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    default:
      return null;
  }
}
