"use client";

import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, Check, X } from "lucide-react";
import { toast } from "sonner";

interface StoryLabel {
  label: { id: string; name: string; color: string };
}

interface LabelSelectProps {
  storyId: string;
  currentLabels: StoryLabel[];
}

export function LabelSelect({ storyId, currentLabels }: LabelSelectProps) {
  const utils = trpc.useUtils();
  const { data: allLabels } = trpc.label.list.useQuery();

  const addLabel = trpc.label.addToStory.useMutation({
    onSuccess: () => utils.story.getById.invalidate({ id: storyId }),
    onError: (e) => toast.error(e.message),
  });
  const removeLabel = trpc.label.removeFromStory.useMutation({
    onSuccess: () => utils.story.getById.invalidate({ id: storyId }),
    onError: (e) => toast.error(e.message),
  });

  const currentLabelIds = new Set(currentLabels.map((tl) => tl.label.id));

  function toggleLabel(labelId: string) {
    if (currentLabelIds.has(labelId)) removeLabel.mutate({ storyId, labelId });
    else addLabel.mutate({ storyId, labelId });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground"><Tag className="h-3 w-3" /> Labels</label>
        <Popover>
          <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-6 text-xs">Edit</Button></PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="end">
            <p className="mb-2 text-xs font-medium">Toggle labels</p>
            {allLabels && allLabels.length > 0 ? (
              <div className="space-y-1">
                {allLabels.map((label) => (
                  <button key={label.id} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted" onClick={() => toggleLabel(label.id)}>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />
                    <span className="flex-1 text-left">{label.name}</span>
                    {currentLabelIds.has(label.id) && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No labels. Create them in Settings &gt; Labels.</p>
            )}
          </PopoverContent>
        </Popover>
      </div>
      {currentLabels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {currentLabels.map((tl) => (
            <Badge key={tl.label.id} variant="secondary" style={{ borderColor: tl.label.color, borderLeftWidth: 3 }} className="text-[10px] gap-1 pr-1">
              {tl.label.name}
              <button onClick={() => removeLabel.mutate({ storyId, labelId: tl.label.id })} className="ml-0.5 hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No labels</p>
      )}
    </div>
  );
}
