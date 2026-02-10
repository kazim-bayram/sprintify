"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function QualityGateChecklist({ storyId }: { storyId: string }) {
  const utils = trpc.useUtils();
  const { data: items } = trpc.checklist.list.useQuery({ storyId });
  const [newDorTitle, setNewDorTitle] = useState("");
  const [newDodTitle, setNewDodTitle] = useState("");

  const createMutation = trpc.checklist.create.useMutation({
    onSuccess: () => { setNewDorTitle(""); setNewDodTitle(""); utils.checklist.list.invalidate({ storyId }); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.checklist.toggle.useMutation({
    onSuccess: () => utils.checklist.list.invalidate({ storyId }),
  });
  const deleteMutation = trpc.checklist.delete.useMutation({
    onSuccess: () => utils.checklist.list.invalidate({ storyId }),
  });

  const dorItems = items?.filter((i) => i.type === "DOR") ?? [];
  const dodItems = items?.filter((i) => i.type === "DOD") ?? [];

  const dorComplete = dorItems.length > 0 && dorItems.every((i) => i.checked);
  const dodComplete = dodItems.length > 0 && dodItems.every((i) => i.checked);

  return (
    <div className="space-y-4">
      {/* DoR Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-semibold">Definition of Ready</span>
          {dorItems.length > 0 && (
            <Badge variant={dorComplete ? "default" : "secondary"} className="text-[10px] h-4">
              {dorItems.filter((i) => i.checked).length}/{dorItems.length}
            </Badge>
          )}
        </div>
        {dorItems.map((item) => (
          <div key={item.id} className="group flex items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50">
            <Checkbox checked={item.checked} onCheckedChange={() => toggleMutation.mutate({ id: item.id })} />
            <span className={`flex-1 text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.title}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteMutation.mutate({ id: item.id })}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); if (newDorTitle.trim()) createMutation.mutate({ storyId, title: newDorTitle.trim(), type: "DOR" }); }} className="flex items-center gap-2">
          <Input value={newDorTitle} onChange={(e) => setNewDorTitle(e.target.value)} placeholder="Add ready prerequisite..." className="h-7 text-xs" />
          <Button type="submit" size="icon" variant="ghost" className="h-7 w-7" disabled={!newDorTitle.trim()}><Plus className="h-3.5 w-3.5" /></Button>
        </form>
      </div>

      {/* DoD Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
          <span className="text-xs font-semibold">Definition of Done</span>
          {dodItems.length > 0 && (
            <Badge variant={dodComplete ? "default" : "secondary"} className="text-[10px] h-4">
              {dodItems.filter((i) => i.checked).length}/{dodItems.length}
            </Badge>
          )}
          {dodItems.length > 0 && !dodComplete && (
            <span className="text-[10px] text-destructive ml-auto">Blocks &quot;Done&quot; column</span>
          )}
        </div>
        {dodItems.map((item) => (
          <div key={item.id} className="group flex items-center gap-2 rounded px-1 py-0.5 hover:bg-muted/50">
            <Checkbox checked={item.checked} onCheckedChange={() => toggleMutation.mutate({ id: item.id })} />
            <span className={`flex-1 text-sm ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.title}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => deleteMutation.mutate({ id: item.id })}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); if (newDodTitle.trim()) createMutation.mutate({ storyId, title: newDodTitle.trim(), type: "DOD" }); }} className="flex items-center gap-2">
          <Input value={newDodTitle} onChange={(e) => setNewDodTitle(e.target.value)} placeholder="Add done requirement..." className="h-7 text-xs" />
          <Button type="submit" size="icon" variant="ghost" className="h-7 w-7" disabled={!newDodTitle.trim()}><Plus className="h-3.5 w-3.5" /></Button>
        </form>
      </div>
    </div>
  );
}
