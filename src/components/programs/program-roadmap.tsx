"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import type { ProgramDetails } from "./program-dashboard";

interface ProgramRoadmapProps {
  projects: ProgramDetails["projects"];
}

export function ProgramRoadmap({ projects }: ProgramRoadmapProps) {
  const router = useRouter();

  // Calculate date range
  const { minDate, maxDate, monthHeaders } = useMemo(() => {
    const dates = projects
      .flatMap((p) => [p.startDate, p.endDate])
      .filter((d): d is Date => d !== null);

    if (dates.length === 0) {
      const today = new Date();
      return {
        minDate: startOfMonth(today),
        maxDate: endOfMonth(today),
        monthHeaders: [today],
      };
    }

    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));

    const start = startOfMonth(min);
    const end = endOfMonth(max);

    return {
      minDate: start,
      maxDate: end,
      monthHeaders: eachMonthOfInterval({ start, end }),
    };
  }, [projects]);

  const totalDays = differenceInDays(maxDate, minDate);
  const rowHeight = 40;
  const headerHeight = 60;
  const leftColumnWidth = 200;
  const dayWidth = Math.max(2, (800 - leftColumnWidth) / Math.max(1, totalDays));

  // Calculate project bar positions
  const projectBars = projects.map((project) => {
    if (!project.startDate || !project.endDate) return null;

    const startOffset = differenceInDays(project.startDate, minDate);
    const duration = differenceInDays(project.endDate, project.startDate);
    const left = leftColumnWidth + startOffset * dayWidth;
    const width = Math.max(20, duration * dayWidth);

    return {
      project,
      left,
      width,
      startOffset,
    };
  }).filter((bar): bar is NonNullable<typeof bar> => bar !== null);

  // Find milestones (phases marked as gates or milestones)
  const milestones = useMemo(() => {
    const milestoneMap = new Map<string, { date: Date; label: string; projectName: string }[]>();

    for (const project of projects) {
      for (const phase of project.phases) {
        if (phase.isGate && phase.endDate) {
          const monthKey = format(phase.endDate, "yyyy-MM");
          if (!milestoneMap.has(monthKey)) {
            milestoneMap.set(monthKey, []);
          }
          milestoneMap.get(monthKey)!.push({
            date: phase.endDate,
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
          <div className="flex" style={{ paddingLeft: leftColumnWidth }}>
            {monthHeaders.map((month, idx) => {
              const monthStart = startOfMonth(month);
              const monthEnd = endOfMonth(month);
              const monthStartOffset = Math.max(0, differenceInDays(monthStart, minDate));
              const monthDays = differenceInDays(monthEnd, monthStart) + 1;
              const left = monthStartOffset * dayWidth;
              const width = monthDays * dayWidth;

              return (
                <div
                  key={month.getTime()}
                  className="border-r border-border text-center text-xs font-medium py-2"
                  style={{ left, width, position: "absolute" }}
                >
                  {format(month, "MMM yyyy")}
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Rows */}
        <div className="mt-2">
          {projects.map((project, idx) => {
            const bar = projectBars.find((b) => b.project.id === project.id);
            const projectColor = project.color || "#3B82F6";

            return (
              <div
                key={project.id}
                className="flex items-center border-b border-border hover:bg-muted/50 transition-colors cursor-pointer"
                style={{ height: rowHeight }}
                onClick={() => router.push(`/projects/${project.key.toLowerCase()}/timeline`)}
              >
                {/* Project Name */}
                <div
                  className="px-3 font-medium text-sm flex-shrink-0 border-r border-border"
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
                        left: `${bar.left}px`,
                        width: `${bar.width}px`,
                        backgroundColor: projectColor,
                        minWidth: "20px",
                      }}
                    >
                      {bar.width > 60 && (
                        <span className="truncate block">
                          {project.startDate && format(project.startDate, "MMM d")} -{" "}
                          {project.endDate && format(project.endDate, "MMM d")}
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
                  const milestoneOffset = differenceInDays(milestone.date, minDate);
                  const left = leftColumnWidth + milestoneOffset * dayWidth;

                  return (
                    <div
                      key={`${monthKey}-${idx}`}
                      className="flex items-center gap-2 text-sm"
                      style={{ paddingLeft: `${left}px` }}
                    >
                      <div
                        className="w-3 h-3 rotate-45 border-2 border-purple-600 bg-purple-100"
                        style={{ transform: "rotate(45deg)" }}
                      />
                      <span className="font-medium">{milestone.label}</span>
                      <span className="text-muted-foreground">({milestone.projectName})</span>
                      <span className="text-xs text-muted-foreground">
                        {format(milestone.date, "MMM d, yyyy")}
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
