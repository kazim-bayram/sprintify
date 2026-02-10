"use client";

import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { PRIORITIES, DEPARTMENTS } from "@/lib/constants";
import { X, Search } from "lucide-react";

interface Filters { search: string; assigneeId: string; priority: string; }

export function BoardFilterBar({ filters, onFiltersChange }: { filters: Filters; onFiltersChange: (f: Filters) => void }) {
  const members = trpc.member.list.useQuery();
  const hasActiveFilters = filters.search || filters.assigneeId || filters.priority;

  return (
    <div className="flex items-center gap-2 border-b px-6 py-2">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Filter stories..." value={filters.search} onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })} className="h-8 pl-8 text-xs" />
      </div>
      <Select value={filters.assigneeId || "all"} onValueChange={(v) => onFiltersChange({ ...filters, assigneeId: v === "all" ? "" : v })}>
        <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Owner" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All owners</SelectItem>
          {members.data?.map((m) => <SelectItem key={m.user.id} value={m.user.id} className="text-xs">{m.user.name ?? m.user.email}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filters.priority || "all"} onValueChange={(v) => onFiltersChange({ ...filters, priority: v === "all" ? "" : v })}>
        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">All priorities</SelectItem>
          {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>)}
        </SelectContent>
      </Select>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => onFiltersChange({ search: "", assigneeId: "", priority: "" })}>
          <X className="mr-1 h-3 w-3" />Clear
        </Button>
      )}
    </div>
  );
}
