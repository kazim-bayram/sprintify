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
import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Idea = RouterOutputs["idea"]["getById"];

interface CreateEditIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ideaId?: string;
}

export function CreateEditIdeaDialog({ open, onOpenChange, ideaId }: CreateEditIdeaDialogProps) {
  const utils = trpc.useUtils();
  const isEditing = !!ideaId;

  const { data: idea } = trpc.idea.getById.useQuery(
    { id: ideaId! },
    { enabled: isEditing && open }
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [businessCase, setBusinessCase] = useState("");
  const [expectedROI, setExpectedROI] = useState<string>("");
  const [strategicAlignment, setStrategicAlignment] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [swotStrengths, setSwotStrengths] = useState<string>("");
  const [swotWeaknesses, setSwotWeaknesses] = useState<string>("");
  const [swotOpportunities, setSwotOpportunities] = useState<string>("");
  const [swotThreats, setSwotThreats] = useState<string>("");

  // Load idea data when editing
  useEffect(() => {
    if (idea) {
      setTitle(idea.title);
      setDescription(idea.description ?? "");
      setBusinessCase(idea.businessCase ?? "");
      setExpectedROI(idea.expectedROI?.toString() ?? "");
      setStrategicAlignment(idea.strategicAlignment);
      const swot = idea.swotAnalysis as
        | { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] }
        | null;
      setSwotStrengths(swot?.strengths?.join("\n") ?? "");
      setSwotWeaknesses(swot?.weaknesses?.join("\n") ?? "");
      setSwotOpportunities(swot?.opportunities?.join("\n") ?? "");
      setSwotThreats(swot?.threats?.join("\n") ?? "");
    } else if (!isEditing) {
      // Reset form for new idea
      setTitle("");
      setDescription("");
      setBusinessCase("");
      setExpectedROI("");
      setStrategicAlignment("MEDIUM");
      setSwotStrengths("");
      setSwotWeaknesses("");
      setSwotOpportunities("");
      setSwotThreats("");
    }
  }, [idea, isEditing, open]);

  const createMutation = trpc.idea.create.useMutation({
    onSuccess: () => {
      toast.success("Idea created successfully!");
      utils.idea.list.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.idea.update.useMutation({
    onSuccess: () => {
      toast.success("Idea updated successfully!");
      utils.idea.list.invalidate();
      utils.idea.getById.invalidate({ id: ideaId! });
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const swotAnalysis =
      swotStrengths || swotWeaknesses || swotOpportunities || swotThreats
        ? {
            strengths: swotStrengths.split("\n").filter((s) => s.trim()),
            weaknesses: swotWeaknesses.split("\n").filter((s) => s.trim()),
            opportunities: swotOpportunities.split("\n").filter((s) => s.trim()),
            threats: swotThreats.split("\n").filter((s) => s.trim()),
          }
        : undefined;

    if (isEditing) {
      updateMutation.mutate({
        id: ideaId!,
        title,
        description: description || undefined,
        businessCase: businessCase || undefined,
        expectedROI: expectedROI ? parseFloat(expectedROI) : undefined,
        strategicAlignment,
        swotAnalysis,
      });
    } else {
      createMutation.mutate({
        title,
        description: description || undefined,
        businessCase: businessCase || undefined,
        expectedROI: expectedROI ? parseFloat(expectedROI) : undefined,
        strategicAlignment,
        swotAnalysis,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Idea" : "Create New Idea"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the idea details below."
              : "Capture a new business idea with strategic context and analysis."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Q3 Marketing Campaign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief overview of the idea..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="strategicAlignment">Strategic Alignment</Label>
              <Select value={strategicAlignment} onValueChange={(v) => setStrategicAlignment(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expectedROI">Expected ROI (%)</Label>
              <Input
                id="expectedROI"
                type="number"
                step="0.1"
                placeholder="e.g., 25.5"
                value={expectedROI}
                onChange={(e) => setExpectedROI(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="businessCase">Business Case</Label>
            <Textarea
              id="businessCase"
              placeholder="Detailed business justification, market opportunity, competitive analysis..."
              value={businessCase}
              onChange={(e) => setBusinessCase(e.target.value)}
              rows={5}
            />
          </div>

          <div className="space-y-3">
            <Label>SWOT Analysis (one item per line)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="strengths" className="text-xs text-muted-foreground">
                  Strengths
                </Label>
                <Textarea
                  id="strengths"
                  placeholder="Internal advantages..."
                  value={swotStrengths}
                  onChange={(e) => setSwotStrengths(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="weaknesses" className="text-xs text-muted-foreground">
                  Weaknesses
                </Label>
                <Textarea
                  id="weaknesses"
                  placeholder="Internal limitations..."
                  value={swotWeaknesses}
                  onChange={(e) => setSwotWeaknesses(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="opportunities" className="text-xs text-muted-foreground">
                  Opportunities
                </Label>
                <Textarea
                  id="opportunities"
                  placeholder="External opportunities..."
                  value={swotOpportunities}
                  onChange={(e) => setSwotOpportunities(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="threats" className="text-xs text-muted-foreground">
                  Threats
                </Label>
                <Textarea
                  id="threats"
                  placeholder="External risks..."
                  value={swotThreats}
                  onChange={(e) => setSwotThreats(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {isEditing ? "Update" : "Create"} Idea
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
