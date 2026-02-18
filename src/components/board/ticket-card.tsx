"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PRIORITIES, DEPARTMENTS, calculateWSJF } from "@/lib/constants";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useProjectTerminology } from "@/hooks/use-project-terminology";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Story =
  RouterOutputs["project"]["getByKey"]["boardColumns"][number]["stories"][number];

interface TicketCardProps {
  ticket: Story;
  projectKey: string;
  methodology: "AGILE" | "WATERFALL" | "HYBRID";
  onClick?: () => void;
}

export function TicketCard({ ticket: story, projectKey, methodology, onClick }: TicketCardProps) {
  const terminology = useProjectTerminology(methodology);
  const isWaterfall = terminology.isWaterfall;
  const isAgile = terminology.isAgile;
  const isHybrid = terminology.isHybrid;

  const priority = PRIORITIES.find((p) => p.value === (story.priority ?? "NONE"));
  const dept = DEPARTMENTS.find((d) => d.value === story.department);
  const wsjf = calculateWSJF(
    story.userBusinessValue,
    story.timeCriticality,
    story.riskReduction,
    story.jobSize
  );

  // DoD progress
  const dodItems = story.checklists ?? [];
  const dodChecked = dodItems.filter((c) => c.checked).length;
  const dodTotal = dodItems.length;
  const dodComplete = dodTotal > 0 && dodChecked === dodTotal;

  const assigneeInitials = story.assignee?.name
    ? story.assignee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : story.assignee?.email?.charAt(0).toUpperCase() ?? null;

  return (
    <Card className="cursor-pointer p-3 transition-shadow hover:shadow-md" onClick={onClick}>
      {/* Top row: Department + WSJF + Priority */}
      <div className="mb-2 flex items-center gap-1.5 flex-wrap">
        {dept && (
          <Badge
            style={{ backgroundColor: dept.color, color: "white" }}
            className="px-1.5 py-0 text-[10px] font-medium"
          >
            {dept.shortLabel}
          </Badge>
        )}
        {!isWaterfall && wsjf > 0 && (
          <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold border-primary text-primary">
            WSJF {wsjf}
          </Badge>
        )}
        {priority && priority.value !== "NONE" && (
          <Badge
            variant={priority.color === "destructive" ? "destructive" : "secondary"}
            className="px-1.5 py-0 text-[10px]"
          >
            {priority.label}
          </Badge>
        )}
        {/* Story Points (Agile / Hybrid only) */}
        {(isAgile || isHybrid) && story.storyPoints != null && (
          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
            {story.storyPoints}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium leading-snug">{story.title}</p>

      {/* Feature tag */}
      {story.feature && (
        <p className="mt-1 text-[10px] text-muted-foreground italic">{story.feature.name}</p>
      )}

      {/* Footer: ID + DoD + Tasks + Assignee */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground">
            {projectKey}-{story.number}
          </span>
          {dodTotal > 0 && (
            <span className={`flex items-center gap-0.5 text-[10px] ${dodComplete ? "text-green-600" : "text-muted-foreground"}`}>
              {dodComplete ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
              {dodChecked}/{dodTotal}
            </span>
          )}
          {story._count.tasks > 0 && (
            <span className="text-[10px] text-muted-foreground">{story._count.tasks} tasks</span>
          )}
          {/* Waterfall: show phase due date + progress */}
          {isWaterfall && story.phase && (
            <span className="text-[10px] text-muted-foreground">
              {story.phase.endDate && (
                <>Due {new Date(story.phase.endDate).toLocaleDateString()} · </>
              )}
              {typeof story.phase.progress === "number" && `${story.phase.progress}%`}
            </span>
          )}
          {/* Agile: show sprint name */}
          {isAgile && story.sprint && (
            <span className="text-[10px] text-muted-foreground">
              Sprint: {story.sprint.name}
            </span>
          )}
        </div>

        {story.assignee && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={story.assignee.avatarUrl ?? undefined} alt={story.assignee.name ?? ""} />
            <AvatarFallback className="text-[8px]">{assigneeInitials}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </Card>
  );
}
