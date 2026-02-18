"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type WbsItem = RouterOutputs["story"]["listWbs"][number];

interface WbsGridProps {
  projectId: string;
  methodology: "AGILE" | "WATERFALL" | "HYBRID";
}

export function WbsGrid({ projectId, methodology }: WbsGridProps) {
  const utils = trpc.useUtils();

  const storiesQuery = trpc.story.listWbs.useQuery(
    { projectId },
    { enabled: methodology !== "AGILE" },
  );

  const [editing, setEditing] = useState<{ id: string; field: "title" | "duration"; value: string } | null>(null);
  const updateStory = trpc.story.update.useMutation({
    onSuccess: () => {
      toast.success("Task updated");
      utils.story.listWbs.invalidate({ projectId });
      setEditing(null);
    },
    onError: (err) => toast.error(err.message),
  });

  if (methodology === "AGILE") {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center justify-center text-sm text-muted-foreground">
          WBS is only available for Waterfall and Hybrid projects.
        </CardContent>
      </Card>
    );
  }

  if (storiesQuery.isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const items = (storiesQuery.data ?? []) as WbsItem[];

  if (!items.length) {
    return (
      <Card className="h-full">
        <CardContent className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
          <AlertTriangle className="h-8 w-8" />
          <p className="text-sm font-medium">
            No WBS tasks defined yet. Create stories/tasks and assign them to phases.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by phase for simple hierarchical IDs (1.1, 1.2, 2.1...)
  const phases = Array.from(
    items.reduce((map, story) => {
      const key = story.phaseName ?? "Unassigned";
      if (!map.has(key)) map.set(key, [] as WbsItem[]);
      map.get(key)!.push(story);
      return map;
    }, new Map<string, WbsItem[]>()),
  );

  function renderCell(story: WbsItem, field: "title" | "duration") {
    const id = story.id;
    const isEditing = editing && editing.id === id && editing.field === field;
    const value =
      field === "title"
        ? (isEditing ? editing!.value : story.title)
        : isEditing
          ? editing!.value
          : String((story as any).duration ?? 0);

    if (!isEditing) {
      return (
        <span
          className="cursor-text"
          onDoubleClick={() => setEditing({ id, field, value })}
        >
          {value}
        </span>
      );
    }

    return (
      <Input
        autoFocus
        className="h-8 text-xs"
        value={value}
        onChange={(e) => setEditing({ id, field, value: e.target.value })}
        onBlur={() => {
          if (!editing) return;
          if (field === "title") {
            if (!editing.value.trim()) {
              setEditing(null);
              return;
            }
            updateStory.mutate({ id, title: editing.value.trim() });
          } else {
            const num = parseFloat(editing.value || "0");
            updateStory.mutate({ id, duration: isNaN(num) ? 0 : num });
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setEditing(null);
        }}
      />
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">WBS Grid</CardTitle>
        <CardDescription className="text-sm">
          Hierarchical Work Breakdown Structure with inline editing for task names and durations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead className="w-40">Phase</TableHead>
              <TableHead className="w-32">Duration (days)</TableHead>
              <TableHead className="w-40">Predecessors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {phases.map(([phaseName, stories], pIndex) =>
              stories.map((story, sIndex) => {
                const wbsId = `${pIndex + 1}.${sIndex + 1}`;
                const predecessors =
                  ((story as any).predecessors as {
                    id: string;
                    number: number;
                    title: string;
                  }[]) ?? [];

                return (
                  <TableRow key={story.id}>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {wbsId}
                    </TableCell>
                    <TableCell className="text-sm">
                      {renderCell(story, "title")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {phaseName === "Unassigned" ? (
                        <Badge variant="outline" className="text-[10px]">
                          Unassigned
                        </Badge>
                      ) : (
                        phaseName
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {renderCell(story, "duration")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {predecessors.length === 0
                        ? "—"
                        : predecessors
                            .map((p) => `${p.number}: ${p.title}`)
                            .join(", ")}
                    </TableCell>
                  </TableRow>
                );
              }),
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

