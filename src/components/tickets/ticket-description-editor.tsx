"use client";

import { trpc } from "@/trpc/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

interface TicketDescriptionEditorProps {
  ticket: { id: string; description: string | null };
}

export function TicketDescriptionEditor({ ticket }: TicketDescriptionEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(ticket.description ?? "");

  const updateMutation = trpc.ticket.update.useMutation({
    onSuccess: () => {
      setEditing(false);
      router.refresh();
    },
  });

  useEffect(() => {
    setDescription(ticket.description ?? "");
  }, [ticket.description]);

  function handleSave() {
    const value = description.trim() || null;
    if (value === (ticket.description ?? null)) {
      setEditing(false);
      return;
    }
    updateMutation.mutate({ id: ticket.id, description: value });
  }

  if (!editing) {
    return (
      <div
        className="group cursor-pointer rounded px-1 -mx-1 py-1 hover:bg-muted/50"
        onClick={() => setEditing(true)}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Description</span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
        </div>
        {ticket.description ? (
          <p className="whitespace-pre-wrap text-sm">{ticket.description}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">Click to add a description...</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-muted-foreground">Description</span>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add a description..."
        rows={5}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setDescription(ticket.description ?? "");
            setEditing(false);
          }}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
