"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";

export interface ProgramRoadmapProject {
  id: string;
  name: string;
  key: string;
  color: string | null;
  methodology: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  _count: { stories: number };
  phases: Array<{
    id: string;
    name: string;
    startDate: Date | string | null;
    endDate: Date | string | null;
    progress: number;
    isGate: boolean;
  }>;
}

interface ProgramRoadmapProps {
  projects: ProgramRoadmapProject[];
}

type ProjectBar = {
  project: ProgramRoadmapProject & { startDate: Date; endDate: Date };
  left: number;
  width: number;
  startOffset: number;
};

export function ProgramRoadmap({ projects }: ProgramRoadmapProps) {
  const router = useRouter();

  // Calculate date range
  const { minDate, maxDate, monthHeaders } = useMemo(() => {
    const rawDates = projects
      .flatMap((p: ProgramRoadmapProject) => [p.startDate, p.endDate])
      .filter((d): d is Date | string => d != null);
    const dates = rawDates.map((d) => (d instanceof Date ? d : new Date(d)));

    if (dates.length === 0) {
      const today = new Date();
      return {
        minDate: startOfMonth(today),
        maxDate: endOfMonth(today),
        monthHeaders: [today],
      };
    }

    const min = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d: Date) => d.getTime())));

    const start = startOfMonth(min);
    const end = endOfMonth(max);

    return {
      minDate: start,
      maxDate: end,
      monthHeaders: eachMonthOfInterval({ start, end }),
    };
  }, [projects]);

  const totalDays = Math.max(0, differenceInDays(maxDate, minDate));
  const rowHeight = 40;
  const headerHeight = 60;
  const leftColumnWidth = 200;
  const dayWidth = Math.max(2, (800 - leftColumnWidth) / Math.max(1, totalDays));

  // Calculate project bar positions
  const projectBars = projects.map((project: ProgramRoadmapProject) => {
    const start = project.startDate ? (project.startDate instanceof Date ? project.startDate : new Date(project.startDate)) : null;
    const end = project.endDate ? (project.endDate instanceof Date ? project.endDate : new Date(project.endDate)) : null;
    if (!start || !end) return null;

    const startOffset = differenceInDays(start, minDate);
    const duration = differenceInDays(end, start);
    const left = leftColumnWidth + startOffset * dayWidth;
    const width = Math.max(20, duration * dayWidth);

    return {
      project: { ...project, startDate: start, endDate: end },
      left,
      width,
      startOffset,
    };
  }).filter((bar): bar is ProjectBar => bar !== null);

  // Find milestones (phases marked as gates or milestones)
  const milestones = useMemo(() => {
    const milestoneMap = new Map<string, { date: Date; label: string; projectName: string }[]>();

    for (const project of projects) {
      for (const phase of project.phases) {
        const endDate = phase.endDate
          ? (phase.endDate instanceof Date ? phase.endDate : new Date(phase.endDate as string | number))
          : null;
        if (phase.isGate && endDate) {
          const monthKey = format(endDate, "yyyy-MM");
          if (!milestoneMap.has(monthKey)) {
            milestoneMap.set(monthKey, []);
          }
          milestoneMap.get(monthKey)!.push({
            date: endDate,
            label: phase.name,
            projectName: project.name,
          });
        }
      }
    }

    return Array.from(milestoneMap.entries()).map(([monthKey, items]) => ({
      monthKey,
      items,
    }));
  }, [projects]);

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ minWidth: leftColumnWidth + totalDays * dayWidth }}>
        {/* Month Headers */}
        <div className="sticky top-0 z-10 bg-background border-b" style={{ height: headerHeight }}>
          <div className="flex h-full" style={{ paddingLeft: leftColumnWidth }}>
            <div className="relative h-full" style={{ width: totalDays * dayWidth }}>
              {monthHeaders.map((month) => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                const monthStartOffset = Math.max(0, differenceInDays(monthStart, minDate));
                const monthDays = differenceInDays(monthEnd, monthStart) + 1;
                const left = monthStartOffset * dayWidth;
                const width = monthDays * dayWidth;

                return (
                  <div
                    key={month.getTime()}
                    className="absolute inset-y-0 border-r border-border flex items-center justify-center text-xs font-medium"
                    style={{ left, width }}
                  >
                    {format(month, "MMM yyyy")}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Project Rows */}
        <div className="mt-2">
          {projects.map((project: ProgramRoadmapProject) => {
            const bar = projectBars.find((b) => b.project.id === project.id);
            const projectColor = project.color || "#3B82F6";

            return (
              <div
                key={project.id}
                className="flex items-center border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                style={{ height: rowHeight }}
                onClick={() => router.push(`/projects/${(project.key ?? "").toLowerCase()}/timeline`)}
              >
                {/* Project Name */}
                <div
                  className="px-3 font-medium text-sm shrink-0 border-r border-border"
                  style={{ width: leftColumnWidth }}
                >
                  <div className="truncate">{project.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {project.methodology} • {project._count.stories} items
                  </div>
                </div>

                {/* Timeline Bar */}
                <div className="relative flex-1" style={{ height: rowHeight }}>
                  {bar && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-medium text-white shadow-sm transition-all hover:shadow-md"
                      style={{
                        left: `${bar.startOffset * dayWidth}px`,
                        width: `${bar.width}px`,
                        backgroundColor: projectColor,
                        minWidth: "20px",
                      }}
                    >
                      {bar.width > 60 && (
                        <span className="truncate block">
                          {format(bar.project.startDate, "MMM d")} – {format(bar.project.endDate, "MMM d")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">Key Program Milestones</h4>
            <div className="space-y-2">
              {milestones.map(({ monthKey, items }) =>
                items.map((milestone, idx) => {
                  const milestoneDate = milestone.date instanceof Date ? milestone.date : new Date(milestone.date);
                  const milestoneOffset = differenceInDays(milestoneDate, minDate);
                  const left = Math.max(0, leftColumnWidth + milestoneOffset * dayWidth);

                  return (
                    <div
                      key={`${monthKey}-${milestone.label}-${idx}`}
                      className="flex items-center gap-2 text-sm"
                      style={{ paddingLeft: `${left}px` }}
                    >
                      <div
                        className="h-3 w-3 shrink-0 rotate-45 border-2 border-purple-600 bg-purple-100"
                        aria-hidden
                      />
                      <span className="font-medium">{milestone.label}</span>
                      <span className="text-muted-foreground">({milestone.projectName})</span>
                      <span className="text-xs text-muted-foreground">
                        {format(milestoneDate, "MMM d, yyyy")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
