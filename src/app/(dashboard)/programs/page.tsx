import { api } from "@/trpc/server";
import { ProgramList } from "@/components/programs/program-list";

export const metadata = {
  title: "Programs — Sprintify",
};

export default async function ProgramsPage() {
  const caller = await api();
  const programs = await caller.program.list();

  return (
    <div className="p-6">
      <ProgramList initialPrograms={programs} />
    </div>
  );
}
