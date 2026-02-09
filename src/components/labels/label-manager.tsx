"use client";

import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PRESET_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#6B7280", // gray
];

export function LabelManager() {
  const utils = trpc.useUtils();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");

  const { data: labels, isLoading } = trpc.label.list.useQuery();

  const createMutation = trpc.label.create.useMutation({
    onSuccess: () => {
      toast.success("Label created");
      setNewName("");
      utils.label.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.label.delete.useMutation({
    onSuccess: () => {
      toast.success("Label deleted");
      utils.label.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), color: newColor });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Labels</h1>
        <p className="text-sm text-muted-foreground">
          Labels are shared across all projects in your organization.
        </p>
      </div>

      {/* Create new label */}
      <form onSubmit={handleCreate} className="mb-6 flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium">Name</label>
          <Input
            placeholder="e.g., Bug, Feature, UX..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={30}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Color</label>
          <div className="flex gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="h-8 w-8 rounded border-2 transition-transform"
                style={{
                  backgroundColor: c,
                  borderColor: c === newColor ? "white" : "transparent",
                  transform: c === newColor ? "scale(1.15)" : "scale(1)",
                }}
                onClick={() => setNewColor(c)}
              />
            ))}
          </div>
        </div>
        <Button type="submit" disabled={!newName.trim() || createMutation.isPending}>
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </form>

      {/* Existing labels */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading labels...</p>
      ) : labels && labels.length > 0 ? (
        <div className="space-y-2">
          {labels.map((label) => (
            <Card key={label.id} className="flex items-center gap-3 p-3">
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              <Badge
                variant="secondary"
                style={{ borderColor: label.color, borderLeftWidth: 3 }}
              >
                {label.name}
              </Badge>
              <span className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => deleteMutation.mutate({ id: label.id })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No labels yet. Create one above.</p>
      )}
    </div>
  );
}
