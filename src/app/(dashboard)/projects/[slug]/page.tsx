import { api } from "@/trpc/server";
import { redirect, notFound } from "next/navigation";

/**
 * Project root — intelligent redirect based on methodology.
 * AGILE    → /board
 * HYBRID   → /timeline
 * WATERFALL → /timeline (Gantt chart view)
 */
export default async function ProjectRootPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const caller = await api();
    const project = await caller.project.getMethodology({ key: slug.toUpperCase() });

    const base = `/projects/${slug}`;

    switch (project.methodology) {
      case "AGILE":
        redirect(`${base}/board`);
        break; // unreachable but satisfies TS
      case "HYBRID":
        redirect(`${base}/timeline`);
        break;
      case "WATERFALL":
        redirect(`${base}/timeline`);
        break;
      default:
        redirect(`${base}/board`);
    }
  } catch {
    notFound();
  }
}
