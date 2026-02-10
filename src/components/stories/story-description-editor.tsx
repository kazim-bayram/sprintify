"use client";

import { trpc } from "@/trpc/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

interface StoryDescriptionEditorProps {
  story: { id: string; description: string | null };
}

export function StoryDescriptionEditor({ story }: StoryDescriptionEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(story.description ?? "");

  const updateMutation = trpc.story.update.useMutation({
    onSuccess: () => { setEditing(false); router.refresh(); },
  });

  useEffect(() => { setDescription(story.description ?? ""); }, [story.description]);

  function handleSave() {
    const value = description.trim() || null;
    if (value === (story.description ?? null)) { setEditing(false); return; }
    updateMutation.mutate({ id: story.id, description: value });
  }

  if (!editing) {
    return (
      <div className="group cursor-pointer rounded px-1 -mx-1 py-1 hover:bg-muted/50" onClick={() => setEditing(true)}>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Description</span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </div>
        {story.description ? (
          <p className="whitespace-pre-wrap text-sm">{story.description}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Click to add acceptance criteria, context...</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground">Description</span>
      <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Acceptance criteria..." rows={5} autoFocus />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => { setDescription(story.description ?? ""); setEditing(false); }}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving..." : "Save"}</Button>
      </div>
    </div>
  );
}
