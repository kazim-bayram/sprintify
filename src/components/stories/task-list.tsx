"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function TaskList({ storyId }: { storyId: string }) {
  const utils = trpc.useUtils();
  const { data: tasks } = trpc.task.list.useQuery({ storyId });
  const [newTitle, setNewTitle] = useState("");

  const createMutation = trpc.task.create.useMutation({
    onSuccess: () => { setNewTitle(""); utils.task.list.invalidate({ storyId }); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.task.toggle.useMutation({
    onSuccess: () => utils.task.list.invalidate({ storyId }),
  });
  const deleteMutation = trpc.task.delete.useMutation({
    onSuccess: () => utils.task.list.invalidate({ storyId }),
  });

  const total = tasks?.length ?? 0;
  const done = tasks?.filter((t) => t.completed).length ?? 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Tasks {total > 0 && `(${done}/${total})`}</span>
      </div>
      {tasks && tasks.length > 0 && (
        <div className="space-y-1">
          {tasks.map((task) => (
            <div key={task.id} className="group flex items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => toggleMutation.mutate({ id: task.id })}
              />
              <span className={`flex-1 text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                {task.title}
              </span>
              {task.assignee && (
                <Avatar className="h-4 w-4">
                  <AvatarImage src={task.assignee.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[6px]">{task.assignee.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteMutation.mutate({ id: task.id })}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) createMutation.mutate({ storyId, title: newTitle.trim() }); }}
        className="flex items-center gap-2"
      >
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a task..."
          className="h-7 text-xs"
        />
        <Button type="submit" size="icon" variant="ghost" className="h-7 w-7" disabled={!newTitle.trim()}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
