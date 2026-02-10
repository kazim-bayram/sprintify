"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Kanban, GanttChart, Layers, Users, ListTodo, Calendar, Target, BarChart3,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { METHODOLOGIES } from "@/lib/constants";

interface ProjectOverviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any;
}

const METHODOLOGY_ICONS = {
  AGILE: Kanban,
  HYBRID: Layers,
  WATERFALL: GanttChart,
} as const;

export function ProjectOverview({ project }: ProjectOverviewProps) {
  const slug = project.key.toLowerCase();
  const MethodIcon = METHODOLOGY_ICONS[project.methodology as keyof typeof METHODOLOGY_ICONS] ?? Kanban;
  const methodInfo = METHODOLOGIES.find((m) => m.value === project.methodology);

  // Compute column stats
  const totalStories = project._count?.stories ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boardStories = (project.boardColumns ?? []).reduce((acc: number, col: any) => acc + (col.stories?.length ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doneCol = (project.boardColumns ?? []).find((c: any) => c.name?.toLowerCase().includes("done"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doneCount = doneCol ? (doneCol as any).stories?.length ?? 0 : 0;

  // Quick actions per methodology
  const quickActions = getQuickActions(project.methodology, slug);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="outline" className="font-mono text-xs">{project.key}</Badge>
            <Badge variant="secondary" className="gap-1">
              <MethodIcon className="h-3 w-3" />
              {methodInfo?.label ?? project.methodology}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-muted-foreground max-w-2xl">{project.description}</p>
          )}
        </div>

        {/* Date range (if set) */}
        {(project.startDate || project.endDate) && (
          <div className="text-right text-sm text-muted-foreground">
            {project.startDate && (
              <div className="flex items-center gap-1.5 justify-end">
                <Calendar className="h-3.5 w-3.5" />
                Start: {new Date(project.startDate).toLocaleDateString()}
              </div>
            )}
            {project.endDate && (
              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                <Target className="h-3.5 w-3.5" />
                Target: {new Date(project.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Stories" value={totalStories} icon={ListTodo} />
        <StatCard title="On Board" value={boardStories} icon={Kanban} />
        <StatCard title="Completed" value={doneCount} icon={Target} />
        <StatCard
          title={project.methodology === "AGILE" ? "Features" : "Phases"}
          value={project.methodology === "AGILE" ? project.features.length : project.phases.length}
          icon={project.methodology === "AGILE" ? Layers : GanttChart}
        />
      </div>

      {/* Phase Progress (Hybrid/Waterfall only) */}
      {(project.methodology === "HYBRID" || project.methodology === "WATERFALL") && project.phases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phase Progress</CardTitle>
            <CardDescription>Track progress across project phases.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {project.phases.map((phase: any) => (
                <div key={phase.id} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: phase.color }} />
                  <span className="text-sm font-medium w-40 truncate">{phase.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${phase.progress}%`, backgroundColor: phase.color }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{phase.progress}%</span>
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {phase._count.stories} stories
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3">Quick Actions</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="transition-all hover:shadow-md hover:border-primary/30 cursor-pointer">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", action.bg)}>
                    <action.icon className={cn("h-5 w-5", action.color)} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{action.title}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon: typeof Kanban }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function getQuickActions(methodology: string, slug: string) {
  const base = `/projects/${slug}`;

  if (methodology === "AGILE") {
    return [
      { title: "Sprint Board", description: "View and manage your Scrum board", href: `${base}/board`, icon: Kanban, color: "text-blue-600", bg: "bg-blue-500/10" },
      { title: "Product Backlog", description: "Groom and prioritize stories", href: `${base}/product-backlog`, icon: ListTodo, color: "text-green-600", bg: "bg-green-500/10" },
      { title: "Planning Grid", description: "Rapid story and task creation", href: `${base}/planner`, icon: BarChart3, color: "text-violet-600", bg: "bg-violet-500/10" },
    ];
  }

  if (methodology === "HYBRID") {
    return [
      { title: "Timeline", description: "Phase Gantt chart with sprints", href: `${base}/timeline`, icon: GanttChart, color: "text-indigo-600", bg: "bg-indigo-500/10" },
      { title: "Sprint Board", description: "Execute tasks within phases", href: `${base}/board`, icon: Kanban, color: "text-blue-600", bg: "bg-blue-500/10" },
      { title: "Product Backlog", description: "Manage the full backlog", href: `${base}/product-backlog`, icon: ListTodo, color: "text-green-600", bg: "bg-green-500/10" },
    ];
  }

  // WATERFALL
  return [
    { title: "Gantt Chart", description: "View project phases and milestones", href: `${base}/timeline`, icon: GanttChart, color: "text-amber-600", bg: "bg-amber-500/10" },
    { title: "Documents", description: "Coming soon — document management", href: `${base}/waterfall-notice`, icon: Users, color: "text-gray-600", bg: "bg-gray-500/10" },
  ];
}
