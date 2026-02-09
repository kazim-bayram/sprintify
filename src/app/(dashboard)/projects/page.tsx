import { api } from "@/trpc/server";
import { ProjectList } from "@/components/projects/project-list";

export const metadata = {
  title: "Projects — Sprintify",
};

export default async function ProjectsPage() {
  const caller = await api();
  const projects = await caller.project.list();

  return (
    <div className="p-6">
      <ProjectList initialProjects={projects} />
    </div>
  );
}
