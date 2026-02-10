import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { BacklogView } from "@/components/sprint/backlog-view";

interface BacklogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BacklogPageProps) {
  const { slug } = await params;
  return { title: `${slug.toUpperCase()} Backlog — Sprintify` };
}

export default async function BacklogPage({ params }: BacklogPageProps) {
  const { slug } = await params;

  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });
    return <BacklogView project={project} />;
  } catch {
    notFound();
  }
}
