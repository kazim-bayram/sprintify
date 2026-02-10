import { api } from "@/trpc/server";
import { BoardView } from "@/components/board/board-view";
import { notFound } from "next/navigation";

interface ProductBacklogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductBacklogPageProps) {
  const { slug } = await params;
  return { title: `${slug.toUpperCase()} Product Backlog — Sprintify NPD` };
}

export default async function ProductBacklogPage({ params }: ProductBacklogPageProps) {
  const { slug } = await params;
  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase(), boardType: "GLOBAL_PRODUCT_BACKLOG" });
    return (
      <div className="flex h-full flex-col">
        <BoardView project={project} boardType="GLOBAL_PRODUCT_BACKLOG" />
      </div>
    );
  } catch { notFound(); }
}
