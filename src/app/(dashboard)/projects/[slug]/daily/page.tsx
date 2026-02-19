import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { DailyView } from "@/components/daily/daily-view";

interface DailyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: DailyPageProps) {
  const { slug } = await params;
  return { title: `${slug.toUpperCase()} Daily Stand-up — Sprintify` };
}

export default async function DailyPage({ params }: DailyPageProps) {
  const { slug } = await params;

  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });

    if (project.methodology !== "AGILE" && project.methodology !== "HYBRID") {
      notFound();
    }

    return (
      <DailyView
        projectId={project.id}
        projectKey={project.key}
        methodology={project.methodology}
      />
    );
  } catch {
    notFound();
  }
}
