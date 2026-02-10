"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type CommentItem = RouterOutputs["comment"]["list"][number];

interface CommentListProps {
  storyId: string;
  initialComments: CommentItem[];
}

export function CommentList({ storyId, initialComments }: CommentListProps) {
  const utils = trpc.useUtils();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  const { data: comments } = trpc.comment.list.useQuery({ storyId }, { initialData: initialComments });

  const createMutation = trpc.comment.create.useMutation({
    onSuccess: () => { setNewComment(""); utils.comment.list.invalidate({ storyId }); utils.story.getById.invalidate({ id: storyId }); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.comment.update.useMutation({
    onSuccess: () => { setEditingId(null); utils.comment.list.invalidate({ storyId }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.comment.delete.useMutation({
    onSuccess: () => { utils.comment.list.invalidate({ storyId }); utils.story.getById.invalidate({ id: storyId }); },
    onError: (e) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate({ storyId, body: newComment.trim() });
  }

  function timeAgo(date: Date | string) {
    const d = new Date(date);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  return (
    <div className="space-y-4">
      {comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="group flex gap-3">
              <Avatar className="h-7 w-7 shrink-0"><AvatarImage src={c.user.avatarUrl ?? undefined} /><AvatarFallback className="text-[10px]">{c.user.name?.charAt(0) ?? c.user.email.charAt(0)}</AvatarFallback></Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{c.user.name ?? c.user.email}</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                  <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { setEditingId(c.id); setEditBody(c.body); }}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteMutation.mutate({ id: c.id })}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
                {editingId === c.id ? (
                  <div className="space-y-2">
                    <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={2} autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => updateMutation.mutate({ id: c.id, body: editBody })} disabled={updateMutation.isPending}>Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{c.body}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground py-4">No comments yet</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Write a comment..." rows={2} />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!newComment.trim() || createMutation.isPending}>{createMutation.isPending ? "Posting..." : "Comment"}</Button>
        </div>
      </form>
    </div>
  );
}
