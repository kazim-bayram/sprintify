"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProgramDialog({ open, onOpenChange }: CreateProgramDialogProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const members = trpc.member.list.useQuery();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [strategicGoal, setStrategicGoal] = useState("");
  const [ownerId, setOwnerId] = useState<string>("none");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [budget, setBudget] = useState("");

  const createProgram = trpc.program.create.useMutation({
    onSuccess: (program) => {
      toast.success(`Program "${program.name}" created!`);
      utils.program.list.invalidate();
      onOpenChange(false);
      resetForm();
      router.push(`/programs/${program.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setName("");
    setDescription("");
    setStrategicGoal("");
    setOwnerId("none");
    setStartDate("");
    setTargetDate("");
    setBudget("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    createProgram.mutate({
      name: name.trim(),
      description: description || undefined,
      strategicGoal: strategicGoal || undefined,
      ownerId: ownerId === "none" ? undefined : ownerId,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
      budget: budget ? parseFloat(budget) : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Program</DialogTitle>
          <DialogDescription>
            A program groups related projects to achieve strategic benefits not available individually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="programName">Program Name *</Label>
            <Input
              id="programName"
              placeholder="e.g., Market Dominance in 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="strategicGoal">Strategic Goal</Label>
            <Textarea
              id="strategicGoal"
              placeholder="Describe the strategic objective this program aims to achieve..."
              value={strategicGoal}
              onChange={(e) => setStrategicGoal(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the program..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="owner">Program Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {members.data?.map((m) => (
                    <SelectItem key={m.user.id} value={m.user.id}>
                      {m.user.name || m.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budget">Budget</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
          </div>

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
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProgram.isPending || !name.trim()}>
              {createProgram.isPending ? "Creating..." : "Create Program"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
