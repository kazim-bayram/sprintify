"use client";

import { trpc } from "@/trpc/client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TicketTitleEditorProps {
  ticket: { id: string; title: string };
}

export function TicketTitleEditor({ ticket }: TicketTitleEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(ticket.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateMutation = trpc.ticket.update.useMutation({
    onSuccess: () => {
      setEditing(false);
      router.refresh();
    },
  });

  useEffect(() => {
    setTitle(ticket.title);
  }, [ticket.title]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed || trimmed === ticket.title) {
      setTitle(ticket.title);
      setEditing(false);
      return;
    }
    updateMutation.mutate({ id: ticket.id, title: trimmed });
  }

  if (!editing) {
    return (
      <h2
        className="cursor-pointer text-xl font-semibold leading-tight hover:bg-muted/50 rounded px-1 -mx-1"
        onClick={() => setEditing(true)}
      >
        {ticket.title}
      </h2>
    );
  }

  return (
    <input
      ref={inputRef}
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") {
          setTitle(ticket.title);
          setEditing(false);
        }
      }}
      className="w-full rounded border-none bg-muted/50 px-1 -mx-1 text-xl font-semibold leading-tight outline-none ring-1 ring-primary"
    />
  );
}
