import { api } from "@/trpc/server";
import { GanttChart } from "@/components/timeline/gantt-chart";
import { WbsGrid } from "@/components/timeline/wbs-grid";
import { WaterfallView } from "@/components/waterfall/waterfall-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Timeline — ${slug.toUpperCase()} — Sprintify` };
}

export default async function TimelinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const caller = await api();
    const project = await caller.project.getByKey({ key: slug.toUpperCase() });
    return (
      <div className="flex h-full flex-col">
        {project.methodology === "WATERFALL" ? (
          <WaterfallView
            projectId={project.id}
            projectKey={project.key}
            methodology={project.methodology}
          />
        ) : (
          <Tabs defaultValue="gantt" className="flex h-full flex-col">
            <TabsList className="ml-4 mt-4">
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
              <TabsTrigger value="wbs" disabled={project.methodology === "AGILE"}>
                WBS
              </TabsTrigger>
            </TabsList>
            <TabsContent value="gantt" className="flex-1">
              <GanttChart
                projectId={project.id}
                projectKey={project.key}
                methodology={project.methodology}
              />
            </TabsContent>
            <TabsContent value="wbs" className="flex-1">
              <WbsGrid projectId={project.id} methodology={project.methodology} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    );
  } catch {
    notFound();
  }
}
