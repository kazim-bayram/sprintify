import { api } from "@/trpc/server";
import { BoardView } from "@/components/board/board-view";
import { notFound } from "next/navigation";

interface BoardPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BoardPageProps) {
  const { slug } = await params;
  return {
    title: `${slug.toUpperCase()} Board — Sprintify`,
  };
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { slug } = await params;

  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });
    return (
      <div className="flex h-full flex-col">
        <BoardView project={project} />
      </div>
    );
  } catch {
    notFound();
  }
}
