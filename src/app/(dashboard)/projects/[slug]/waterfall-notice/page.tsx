import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { WaterfallNotice } from "@/components/projects/waterfall-notice";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Waterfall — ${slug.toUpperCase()} — Sprintify` };
}

export default async function WaterfallNoticePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const caller = await api();
    const project = await caller.project.getMethodology({ key: slug.toUpperCase() });

    return (
      <div className="flex h-full flex-col">
        <WaterfallNotice projectKey={project.key} projectName={project.name} methodology={project.methodology} />
      </div>
    );
  } catch {
    notFound();
  }
}
