"use client";

import { trpc } from "@/trpc/client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface StoryTitleEditorProps {
  story: { id: string; title: string };
}

export function StoryTitleEditor({ story }: StoryTitleEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(story.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateMutation = trpc.story.update.useMutation({
    onSuccess: () => { setEditing(false); router.refresh(); },
  });

  useEffect(() => { setTitle(story.title); }, [story.title]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === story.title) { setTitle(story.title); setEditing(false); return; }
    updateMutation.mutate({ id: story.id, title: trimmed });
  }

  if (!editing) {
    return (
      <h2 className="cursor-pointer text-xl font-semibold leading-tight hover:bg-muted/50 rounded px-1 -mx-1" onClick={() => setEditing(true)}>
        {story.title}
      </h2>
    );
  }

  return (
    <input
      ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setTitle(story.title); setEditing(false); } }}
      className="w-full rounded border-none bg-muted/50 px-1 -mx-1 text-xl font-semibold leading-tight outline-none ring-1 ring-primary"
    />
  );
}
