"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Layers, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreateProgramDialog } from "./create-program-dialog";
import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ProgramListItem = RouterOutputs["program"]["list"][number];

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

export function ProgramList({ initialPrograms }: { initialPrograms: ProgramListItem[] }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: programs = initialPrograms } = trpc.program.list.useQuery(undefined, {
    initialData: initialPrograms,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Programs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage related projects together to realize strategic benefits.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New Program
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No programs yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first program to group related projects and track strategic goals.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Create Program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => {
            const ownerInitials = program.owner?.name
              ? program.owner.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : program.owner?.email?.charAt(0).toUpperCase() ?? "?";

            return (
              <Card
                key={program.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/programs/${program.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{program.name}</CardTitle>
                    <div className="flex gap-1">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[program.status]}`}>
                        {program.status}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${HEALTH_COLORS[program.health]}`}>
                        {program.health === "ON_TRACK" && <CheckCircle2 className="mr-1 h-2.5 w-2.5" />}
                        {program.health === "AT_RISK" && <AlertTriangle className="mr-1 h-2.5 w-2.5" />}
                        {program.health === "OFF_TRACK" && <AlertTriangle className="mr-1 h-2.5 w-2.5" />}
                        {program.health}
                      </Badge>
                    </div>
                  </div>
                  {program.description && (
                    <CardDescription className="line-clamp-2">{program.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {program.owner && (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={program.owner.avatarUrl ?? undefined} />
                            <AvatarFallback className="text-[10px]">{ownerInitials}</AvatarFallback>
                          </Avatar>
                          <span className="text-muted-foreground">{program.owner.name}</span>
                        </>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {program._count.projects} {program._count.projects === 1 ? "project" : "projects"}
                    </Badge>
                  </div>
                  {program.strategicGoal && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-muted-foreground line-clamp-2">{program.strategicGoal}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateProgramDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
