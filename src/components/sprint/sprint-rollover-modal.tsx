"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

type Decision = "NEXT_SPRINT" | "BACKLOG";

export function SprintRolloverModal({ open, onOpenChange, sprintId, sprintName, projectId }: { open: boolean; onOpenChange: (o: boolean) => void; sprintId: string; sprintName: string; projectId: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});

  const { data: incompleteStories, isLoading } = trpc.sprint.getIncompleteStories.useQuery({ sprintId }, { enabled: open });
  const closeMutation = trpc.sprint.close.useMutation();
  const rolloverMutation = trpc.sprint.rollover.useMutation();

  async function handleCloseSprint() {
    try {
      await closeMutation.mutateAsync({ id: sprintId });
      if (incompleteStories && incompleteStories.length > 0) {
        const storyDecisions = incompleteStories.map((s) => ({ storyId: s.id, action: decisions[s.id] ?? ("BACKLOG" as Decision) }));
        await rolloverMutation.mutateAsync({ sprintId, decisions: storyDecisions });
      }
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      toast.success(`${sprintName} closed!`);
      utils.sprint.invalidate();
      onOpenChange(false);
      router.refresh();
    } catch { toast.error("Failed to close sprint"); }
  }

  const allDecided = !incompleteStories || incompleteStories.every((s) => decisions[s.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Close {sprintName}</DialogTitle>
          <DialogDescription>
            {!incompleteStories || incompleteStories.length === 0
              ? "All stories are done! Ready to close."
              : `${incompleteStories.length} incomplete stor${incompleteStories.length !== 1 ? "ies" : "y"}. Decide what happens to each.`}
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading stories...</p>
        ) : incompleteStories && incompleteStories.length > 0 ? (
          <div className="max-h-80 overflow-y-auto space-y-3">
            {incompleteStories.map((story) => (
              <div key={story.id} className="flex items-center gap-3 rounded-md border p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{story.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {story.assignee && <Avatar className="h-4 w-4"><AvatarImage src={story.assignee.avatarUrl ?? undefined} /><AvatarFallback className="text-[8px]">{story.assignee.name?.charAt(0) ?? "?"}</AvatarFallback></Avatar>}
                    {story.storyPoints != null && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{story.storyPoints} pts</Badge>}
                  </div>
                </div>
                <Select value={decisions[story.id] ?? ""} onValueChange={(v) => setDecisions((prev) => ({ ...prev, [story.id]: v as Decision }))}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEXT_SPRINT" className="text-xs">Move to Next Sprint</SelectItem>
                    <SelectItem value="BACKLOG" className="text-xs">Move to Backlog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-green-600 text-center py-4">All stories completed! Great work.</p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCloseSprint} disabled={closeMutation.isPending || rolloverMutation.isPending || (incompleteStories && incompleteStories.length > 0 && !allDecided)}>
            {closeMutation.isPending || rolloverMutation.isPending ? "Closing..." : "Close Sprint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
