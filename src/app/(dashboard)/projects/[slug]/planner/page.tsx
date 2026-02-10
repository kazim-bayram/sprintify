import { api } from "@/trpc/server";
import { SprintPlanningGrid } from "@/components/planner/sprint-planning-grid";
import { notFound } from "next/navigation";

interface PlannerPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PlannerPageProps) {
  const { slug } = await params;
  return { title: `${slug.toUpperCase()} Planning Grid — Sprintify` };
}

export default async function PlannerPage({ params }: PlannerPageProps) {
  const { slug } = await params;
  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });
    return (
      <div className="flex h-full flex-col">
        <SprintPlanningGrid projectId={project.id} projectKey={project.key} />
      </div>
    );
  } catch { notFound(); }
}
