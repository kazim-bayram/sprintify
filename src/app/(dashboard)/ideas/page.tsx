import { api } from "@/trpc/server";
import { IdeaKanban } from "@/components/ideas/idea-kanban";

export const metadata = {
  title: "Idea Portal — Sprintify",
};

export default async function IdeasPage() {
  const caller = await api();
  const ideas = await caller.idea.list();

  return (
    <div className="flex h-full flex-col">
      <IdeaKanban initialIdeas={ideas} />
    </div>
  );
}
