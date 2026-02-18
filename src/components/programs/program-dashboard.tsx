"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  ArrowLeft,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ProgramRoadmap } from "./program-roadmap";
import { ProgramProjectTable } from "./program-project-table";
import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { format } from "date-fns";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type ProgramDetails = RouterOutputs["program"]["getById"];

const STATUS_COLORS = {
  PLANNED: "bg-gray-500/10 text-gray-700 border-gray-300",
  ACTIVE: "bg-blue-500/10 text-blue-700 border-blue-300",
  ON_HOLD: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
  COMPLETED: "bg-green-500/10 text-green-700 border-green-300",
} as const;

const HEALTH_COLORS = {
  ON_TRACK: "bg-green-500/10 text-green-700 border-green-300",
  AT_RISK: "bg-yellow-500/10 text-yellow-700 border-yellow-300",
  OFF_TRACK: "bg-red-500/10 text-red-700 border-red-300",
} as const;

const HEALTH_ICONS = {
  ON_TRACK: CheckCircle2,
  AT_RISK: AlertTriangle,
  OFF_TRACK: XCircle,
} as const;

export function ProgramDashboard({ program }: { program: ProgramDetails }) {
  const router = useRouter();
  const metrics = program.metrics;
  const HealthIcon = HEALTH_ICONS[metrics.health];

  const ownerInitials = program.owner?.name
    ? program.owner.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : program.owner?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/programs")} className="mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Programs
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
            <Badge variant="outline" className={STATUS_COLORS[program.status]}>
              {program.status}
            </Badge>
            <Badge variant="outline" className={`${HEALTH_COLORS[metrics.health]} flex items-center gap-1`}>
              <HealthIcon className="h-3 w-3" />
              {metrics.health}
            </Badge>
          </div>
          {program.description && <p className="text-muted-foreground">{program.description}</p>}
          {program.strategicGoal && (
            <div className="pt-2">
              <p className="text-sm font-medium text-muted-foreground">Strategic Goal:</p>
              <p className="text-sm">{program.strategicGoal}</p>
            </div>
          )}
        </div>
        {program.owner && (
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={program.owner.avatarUrl ?? undefined} />
              <AvatarFallback>{ownerInitials}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{program.owner.name || program.owner.email}</p>
              <p className="text-muted-foreground">Program Owner</p>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.totalBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            {metrics.spent > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Spent: ${metrics.spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageProgress}%</div>
            <Progress value={metrics.averageProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeProjects}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {metrics.totalProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI / Benefit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground mt-1">Metric coming soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      {(program.startDate || program.targetDate) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              {program.startDate && (
                <div>
                  <span className="text-muted-foreground">Start:</span>{" "}
                  <span className="font-medium">{format(program.startDate, "MMM d, yyyy")}</span>
                </div>
              )}
              {program.targetDate && (
                <div>
                  <span className="text-muted-foreground">Target:</span>{" "}
                  <span className="font-medium">{format(program.targetDate, "MMM d, yyyy")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Master Roadmap */}
      {program.projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Master Roadmap</CardTitle>
            <CardDescription>Visual timeline of all projects in this program</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgramRoadmap projects={program.projects} />
          </CardContent>
        </Card>
      )}

      {/* Project List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
          <CardDescription>All projects associated with this program</CardDescription>
        </CardHeader>
        <CardContent>
          <ProgramProjectTable projects={program.projects} />
        </CardContent>
      </Card>
    </div>
  );
}
