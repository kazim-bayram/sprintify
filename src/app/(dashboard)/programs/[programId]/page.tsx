import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { ProgramDashboard } from "@/components/programs/program-dashboard";

export const metadata = {
  title: "Program Dashboard — Sprintify",
};

export default async function ProgramDetailPage({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params;
  const caller = await api();

  try {
    const program = await caller.program.getById({ id: programId });
    return <ProgramDashboard program={program} />;
  } catch (error) {
    notFound();
  }
}
