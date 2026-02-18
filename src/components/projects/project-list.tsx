"use client";

import { trpc } from "@/trpc/client";
import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FolderKanban, Kanban, GanttChart, Layers } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CreateProjectDialog } from "./create-project-dialog";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ProjectListItem = RouterOutputs["project"]["list"][number];

export function ProjectList({ initialProjects }: { initialProjects: ProjectListItem[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: projects } = trpc.project.list.useQuery(undefined, { initialData: initialProjects });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your projects and development boards.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />New Project</Button>
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-1 text-lg font-medium">No projects yet</h3>
          <p className="mb-4 text-sm text-muted-foreground">Create your first project to get started.</p>
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Create Project</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const slug = project.key.toLowerCase();
            const href = project.methodology === "AGILE"
              ? `/projects/${slug}/board`
              : `/projects/${slug}/timeline`;
            const MethodIcon = project.methodology === "WATERFALL" ? GanttChart : project.methodology === "HYBRID" ? Layers : Kanban;
            return (
              <Link key={project.id} href={href}>
                <Card className="transition-colors hover:border-primary/50 hover:shadow-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{project.key}</Badge>
                        {project.program && <Badge variant="secondary" className="text-[10px]">{project.program.name}</Badge>}
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <MethodIcon className="h-3 w-3" />{project.methodology}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {project._count.stories} stor{project._count.stories !== 1 ? "ies" : "y"}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.description && <CardDescription className="line-clamp-2">{project.description}</CardDescription>}
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
      <CreateProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
