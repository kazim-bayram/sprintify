"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DEPARTMENTS } from "@/lib/constants";
import { StoryTitleEditor } from "./story-title-editor";
import { StoryDescriptionEditor } from "./story-description-editor";
import { StorySidebar } from "./story-sidebar";
import { LabelSelect } from "./label-select";
import { TaskList } from "./task-list";
import { QualityGateChecklist } from "./quality-gate-checklist";
import { CommentList } from "./comment-list";
import { ActivityFeed } from "./activity-feed";
import { AttachmentList } from "./attachment-list";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type StoryDetail = RouterOutputs["story"]["getById"];

interface StoryDetailSheetProps {
  storyId: string | null;
  onClose: () => void;
}

export function StoryDetailSheet({ storyId, onClose }: StoryDetailSheetProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: story, isLoading } = trpc.story.getById.useQuery(
    { id: storyId! },
    { enabled: !!storyId }
  );

  const archiveMutation = trpc.story.archive.useMutation({
    onSuccess: () => { toast.success("Story archived"); utils.story.getById.invalidate(); router.refresh(); onClose(); },
  });
  const restoreMutation = trpc.story.restore.useMutation({
    onSuccess: () => { toast.success("Story restored"); utils.story.getById.invalidate(); router.refresh(); },
  });

  if (!storyId) return null;

  const dept = story?.department ? DEPARTMENTS.find((d) => d.value === story.department) : null;

  return (
    <Sheet open={!!storyId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {isLoading || !story ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading story...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SheetHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">{story.project.key}-{story.number}</Badge>
                  {dept && (
                    <Badge style={{ backgroundColor: dept.color, color: "white" }} className="text-[10px]">
                      {dept.shortLabel}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {story.archivedAt ? (
                    <Button variant="ghost" size="sm" onClick={() => restoreMutation.mutate({ id: story.id })} disabled={restoreMutation.isPending}>
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />Restore
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => archiveMutation.mutate({ id: story.id })} disabled={archiveMutation.isPending} className="text-destructive hover:text-destructive">
                      <Archive className="mr-1 h-3.5 w-3.5" />Archive
                    </Button>
                  )}
                </div>
              </div>
              <SheetTitle className="text-left"><StoryTitleEditor story={story} /></SheetTitle>
            </SheetHeader>

            {/* Metadata fields with WSJF */}
            <StorySidebar story={story} />

            <Separator />

            {/* Description */}
            <StoryDescriptionEditor story={story} />

            <Separator />

            {/* Labels */}
            <LabelSelect storyId={story.id} currentLabels={story.labels} />

            <Separator />

            {/* Tasks */}
            <TaskList storyId={story.id} />

            <Separator />

            {/* Quality Gates: DoR & DoD */}
            <QualityGateChecklist storyId={story.id} />

            {/* Tabs: Comments / Activity / Files */}
            <Tabs defaultValue="comments" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="comments" className="flex-1">Comments ({story.comments.length})</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">Activity ({story.activities.length})</TabsTrigger>
                <TabsTrigger value="files" className="flex-1">Files ({story.attachments.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="comments" className="mt-3">
                <CommentList storyId={story.id} initialComments={story.comments} />
              </TabsContent>
              <TabsContent value="activity" className="mt-3">
                <ActivityFeed activities={story.activities} />
              </TabsContent>
              <TabsContent value="files" className="mt-3">
                <AttachmentList storyId={story.id} attachments={story.attachments} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
