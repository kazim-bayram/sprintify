"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import type { ProgramDetails } from "./program-dashboard";

interface ProgramProjectTableProps {
  projects: ProgramDetails["projects"];
}

const METHODOLOGY_COLORS = {
  AGILE: "bg-blue-500/10 text-blue-700 border-blue-300",
  WATERFALL: "bg-purple-500/10 text-purple-700 border-purple-300",
  HYBRID: "bg-green-500/10 text-green-700 border-green-300",
} as const;

export function ProgramProjectTable({ projects }: ProgramProjectTableProps) {
  const router = useRouter();

  // Calculate progress for each project
  const projectsWithProgress = projects.map((project) => {
    let progress = 0;
    let nextMilestone: { name: string; date: Date } | null = null;

    if (project.phases.length > 0) {
      const phaseProgress = project.phases.reduce((sum, phase) => sum + phase.progress, 0);
      progress = Math.round(phaseProgress / project.phases.length);

      // Find next milestone (gate phases)
      const upcomingGates = project.phases
        .filter((phase) => phase.isGate && phase.endDate && phase.progress < 100)
        .sort((a, b) => (a.endDate?.getTime() ?? 0) - (b.endDate?.getTime() ?? 0));

      if (upcomingGates.length > 0) {
        nextMilestone = {
          name: upcomingGates[0].name,
          date: upcomingGates[0].endDate!,
        };
      }
    }

    return {
      ...project,
      progress,
      nextMilestone,
    };
  });

  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No projects in this program yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Name</TableHead>
            <TableHead>Methodology</TableHead>
            <TableHead>Lead</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Next Milestone</TableHead>
            <TableHead>Timeline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projectsWithProgress.map((project) => {
            // For now, we don't have a "lead" field on Project, so we'll show methodology badge
            return (
              <TableRow
                key={project.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/projects/${project.key.toLowerCase()}/timeline`)}
              >
                <TableCell className="font-medium">{project.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${METHODOLOGY_COLORS[project.methodology]}`}>
                    {project.methodology}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">—</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {project.phases.length > 0 && project.phases.some((p) => p.progress < 100)
                      ? "Active"
                      : "Completed"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <Progress value={project.progress} className="flex-1" />
                    <span className="text-xs text-muted-foreground w-10 text-right">{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {project.nextMilestone ? (
                    <div className="text-sm">
                      <div className="font-medium">{project.nextMilestone.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(project.nextMilestone.date, "MMM d, yyyy")}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {project.startDate && project.endDate ? (
                    <div className="text-sm">
                      {format(project.startDate, "MMM d")} - {format(project.endDate, "MMM d, yyyy")}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
