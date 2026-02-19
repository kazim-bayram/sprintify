import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { RetroView } from "@/components/retro/retro-view";

interface RetroPageProps {
  params: Promise<{ slug: string; sprintId: string }>;
}

export async function generateMetadata({ params }: RetroPageProps) {
  const { slug, sprintId } = await params;
  return { title: `${slug.toUpperCase()} Retro — Sprintify` };
}

export default async function RetroPage({ params }: RetroPageProps) {
  const { slug, sprintId } = await params;

  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });

    if (project.methodology !== "AGILE" && project.methodology !== "HYBRID") {
      notFound();
    }

    const sprint = await caller.sprint.getById({ id: sprintId });
    if (!sprint || sprint.projectId !== project.id) {
      notFound();
    }

    return (
      <RetroView sprintId={sprintId} projectKey={project.key} />
    );
  } catch {
    notFound();
  }
}
