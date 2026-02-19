import { api } from "@/trpc/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";

interface RetroHubPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RetroHubPageProps) {
  const { slug } = await params;
  return { title: `${slug.toUpperCase()} Retrospective — Sprintify` };
}

export default async function RetroHubPage({ params }: RetroHubPageProps) {
  const { slug } = await params;

  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });

    if (project.methodology !== "AGILE" && project.methodology !== "HYBRID") {
      notFound();
    }

    const sprints = await caller.sprint.list({ projectId: project.id });
    const activeSprint = sprints.find((s) => s.status === "ACTIVE");

    if (activeSprint) {
      redirect(`/projects/${slug.toLowerCase()}/retro/${activeSprint.id}`);
    }

    const closedOrPlanning = sprints.filter(
      (s) => s.status === "CLOSED" || s.status === "PLANNING"
    );

    return (
      <div className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {project.key}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">
            Sprint Retrospective
          </h1>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          No active sprint. Select a sprint to run a retrospective.
        </p>
        {closedOrPlanning.length > 0 ? (
          <div className="space-y-2">
            {closedOrPlanning.map((sprint) => (
              <Link
                key={sprint.id}
                href={`/projects/${slug.toLowerCase()}/retro/${sprint.id}`}
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <span className="font-medium">{sprint.name}</span>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      sprint.status === "CLOSED" ? "secondary" : "outline"
                    }
                  >
                    {sprint.status}
                  </Badge>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No sprints yet. Create a sprint first.
          </div>
        )}
      </div>
    );
  } catch {
    notFound();
  }
}
