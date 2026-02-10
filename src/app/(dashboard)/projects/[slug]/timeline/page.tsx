import { api } from "@/trpc/server";
import { GanttChart } from "@/components/timeline/gantt-chart";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Timeline — ${slug.toUpperCase()} — Sprintify NPD` };
}

export default async function TimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });
    return (
      <div className="flex h-full flex-col">
        <GanttChart
          projectId={project.id}
          projectKey={project.key}
          methodology={project.methodology}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
