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

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectKey: string;
  columnId?: string;
}

export function CreateStoryDialog({ open, onOpenChange, projectId, projectKey, columnId }: CreateStoryDialogProps) {
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

  const members = trpc.member.list.useQuery();

  const createStory = trpc.story.create.useMutation({
    onSuccess: (story) => {
      toast.success(`${projectKey}-${story.number} created!`);
      onOpenChange(false);
      resetForm();
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setTitle(""); setDescription(""); setPriority("NONE"); setDepartment("none");
    setStoryPoints("none"); setAssigneeId("unassigned");
    setUserBusinessValue("0"); setTimeCriticality("0"); setRiskReduction("0"); setJobSize("1");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    createStory.mutate({
      projectId, title,
      description: description || undefined,
      columnId, priority,
      department: department === "none" ? null : department,
      storyPoints: storyPoints === "none" ? null : parseInt(storyPoints),
      assigneeId: assigneeId === "unassigned" ? undefined : assigneeId,
      userBusinessValue: parseInt(userBusinessValue),
      timeCriticality: parseInt(timeCriticality),
      riskReduction: parseInt(riskReduction),
      jobSize: parseInt(jobSize) || 1,
    });
  }

  useEffect(() => { if (open) setTimeout(() => titleRef.current?.focus(), 100); }, [open]);

  const wsjf = calculateWSJF(parseInt(userBusinessValue), parseInt(timeCriticality), parseInt(riskReduction), parseInt(jobSize) || 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create User Story</DialogTitle>
          <DialogDescription>Add a new story to {projectKey}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="storyTitle">Title</Label>
            <Input ref={titleRef} id="storyTitle" placeholder="As [role], I need to..." value={title} onChange={(e) => setTitle(e.target.value)} required />
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
            <div className="space-y-1.5">
              <Label>Story Points (Job Size)</Label>
              <Select value={storyPoints} onValueChange={setStoryPoints}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {STORY_POINTS.map((sp) => <SelectItem key={sp} value={sp.toString()}>{sp} pt{sp !== 1 ? "s" : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
          <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">WSJF Prioritization</span>
              {wsjf > 0 && <span className="text-sm font-bold text-primary">Score: {wsjf}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px]">Business Value</Label>
                <Select value={userBusinessValue} onValueChange={setUserBusinessValue}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    {WSJF_SCALE.map((v) => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Time Criticality</Label>
                <Select value={timeCriticality} onValueChange={setTimeCriticality}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    {WSJF_SCALE.map((v) => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Risk Reduction</Label>
                <Select value={riskReduction} onValueChange={setRiskReduction}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0</SelectItem>
                    {WSJF_SCALE.map((v) => <SelectItem key={v} value={v.toString()}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">WSJF = (Value + Criticality + Risk) / Job Size</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>Cancel</Button>
            <Button type="submit" disabled={createStory.isPending || !title}>{createStory.isPending ? "Creating..." : "Create Story"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
