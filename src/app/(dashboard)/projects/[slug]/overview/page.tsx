import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { ProjectOverview } from "@/components/projects/project-overview";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${slug.toUpperCase()} Overview — Sprintify` };
}

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });
    return (
      <div className="flex h-full flex-col">
        <ProjectOverview project={project} />
      </div>
    );
  } catch {
    notFound();
  }
}
