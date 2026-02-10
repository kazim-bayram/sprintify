import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { SprintHistoryView } from "@/components/sprint/sprint-history-view";

interface SprintHistoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SprintHistoryPageProps) {
  const { slug } = await params;
  return { title: `${slug.toUpperCase()} Sprints — Sprintify` };
}

export default async function SprintHistoryPage({ params }: SprintHistoryPageProps) {
  const { slug } = await params;

  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });
    return <SprintHistoryView projectId={project.id} projectKey={project.key} />;
  } catch {
    notFound();
  }
}
