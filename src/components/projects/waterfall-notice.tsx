"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Construction, ArrowRight, Layers, GanttChart, Kanban, Wrench } from "lucide-react";

interface WaterfallNoticeProps {
  projectKey: string;
  projectName: string;
  methodology: string;
}

export function WaterfallNotice({ projectKey, projectName, methodology }: WaterfallNoticeProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const switchMut = trpc.project.updateMethodology.useMutation({
    onSuccess: (updated) => {
      toast.success(`"${projectName}" switched to Hybrid mode!`);
      utils.project.getMethodology.invalidate();
      utils.project.list.invalidate();
      router.push(`/projects/${projectKey.toLowerCase()}/timeline`);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      {/* Icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-500/10">
        <Construction className="h-10 w-10 text-amber-500" />
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold tracking-tight">
        Classic Waterfall Management
      </h1>
      <Badge variant="outline" className="mt-3 text-amber-600 bg-amber-500/10 border-amber-300">
        <Wrench className="mr-1 h-3 w-3" /> Under Construction
      </Badge>

      {/* Description */}
      <p className="mt-6 max-w-lg text-muted-foreground leading-relaxed">
        Full Waterfall management with strict phase gates, milestone tracking, and document
        management is coming soon. We&apos;re building something great.
      </p>

      {/* What's available now */}
      <div className="mt-8 rounded-xl border bg-card p-6 max-w-md w-full text-left">
        <h3 className="text-sm font-semibold mb-3">What you can do right now:</h3>
        <ul className="space-y-2.5">
          <li className="flex items-start gap-2.5 text-sm">
            <GanttChart className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            <span><strong>Gantt Chart</strong> — Visual phase timeline with drag & drop and dependencies</span>
          </li>
          <li className="flex items-start gap-2.5 text-sm">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
            <span><strong>Hybrid Mode</strong> — Waterfall phases with Agile sprints inside each phase</span>
          </li>
          <li className="flex items-start gap-2.5 text-sm">
            <Kanban className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
            <span><strong>Sprint Boards</strong> — Execute tasks within phases using Scrum boards</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Button
          size="lg"
          onClick={() => switchMut.mutate({ key: projectKey, methodology: "HYBRID" })}
          disabled={switchMut.isPending}
          className="gap-2"
        >
          {switchMut.isPending ? "Switching..." : (
            <>
              <Layers className="h-4 w-4" />
              Switch to Hybrid Mode
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push(`/projects/${projectKey.toLowerCase()}/timeline`)}
          className="gap-2"
        >
          <GanttChart className="h-4 w-4" />
          View Gantt Chart
        </Button>
      </div>

      {/* Footer hint */}
      <p className="mt-6 text-xs text-muted-foreground">
        Switching to Hybrid preserves all your phases and adds Sprint capabilities.
      </p>
    </div>
  );
}
