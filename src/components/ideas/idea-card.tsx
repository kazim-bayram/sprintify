"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, Target, ExternalLink } from "lucide-react";
import { format } from "date-fns";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Idea = RouterOutputs["idea"]["list"][number];

interface IdeaCardProps {
  idea: Idea;
  onClick?: () => void;
}

const STATUS_COLORS = {
  DRAFT: "bg-gray-500/10 text-gray-700 border-gray-300",
  REVIEW: "bg-blue-500/10 text-blue-700 border-blue-300",
  APPROVED: "bg-green-500/10 text-green-700 border-green-300",
  REJECTED: "bg-red-500/10 text-red-700 border-red-300",
} as const;

const STRATEGIC_ALIGNMENT_COLORS = {
  HIGH: "bg-purple-500/10 text-purple-700 border-purple-300",
  MEDIUM: "bg-blue-500/10 text-blue-700 border-blue-300",
  LOW: "bg-gray-500/10 text-gray-700 border-gray-300",
} as const;

export function IdeaCard({ idea, onClick }: IdeaCardProps) {
  const statusColor = STATUS_COLORS[idea.status];
  const alignmentColor = STRATEGIC_ALIGNMENT_COLORS[idea.strategicAlignment];

  const creatorInitials = idea.createdBy?.name
    ? idea.createdBy.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : idea.createdBy?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <Card
      className={`cursor-pointer p-4 transition-shadow hover:shadow-md ${
        idea.linkedProject ? "border-primary/50 bg-primary/5" : ""
      }`}
      onClick={onClick}
    >
      {/* Header: Status + Strategic Alignment */}
      <div className="mb-2 flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={`text-[10px] font-semibold ${statusColor}`}>
          {idea.status}
        </Badge>
        <Badge variant="outline" className={`text-[10px] ${alignmentColor}`}>
          <Target className="mr-1 h-2.5 w-2.5" />
          {idea.strategicAlignment}
        </Badge>
        {idea.linkedProject && (
          <Badge variant="outline" className="text-[10px] text-primary border-primary">
            <ExternalLink className="mr-1 h-2.5 w-2.5" />
            Linked
          </Badge>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{idea.title}</h3>

      {/* Description */}
      {idea.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{idea.description}</p>
      )}

      {/* Metrics Row */}
      <div className="flex items-center gap-3 mb-3">
        {idea.expectedROI != null && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">{idea.expectedROI.toFixed(1)}% ROI</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lightbulb className="h-3 w-3" />
          <span>{format(new Date(idea.createdAt), "MMM d, yyyy")}</span>
        </div>
      </div>

      {/* Footer: Creator */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <Avatar className="h-6 w-6">
          <AvatarImage src={idea.createdBy?.avatarUrl ?? undefined} />
          <AvatarFallback className="text-[10px]">{creatorInitials}</AvatarFallback>
        </Avatar>
        <span className="text-xs text-muted-foreground truncate">
          {idea.createdBy?.name ?? idea.createdBy?.email ?? "Unknown"}
        </span>
      </div>
    </Card>
  );
}
