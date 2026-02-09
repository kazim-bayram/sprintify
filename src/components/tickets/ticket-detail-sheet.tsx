"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Archive, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TicketTitleEditor } from "./ticket-title-editor";
import { TicketDescriptionEditor } from "./ticket-description-editor";
import { TicketSidebar } from "./ticket-sidebar";
import { LabelSelect } from "./label-select";
import { CommentList } from "./comment-list";
import { ActivityFeed } from "./activity-feed";
import { AttachmentList } from "./attachment-list";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TicketDetail = RouterOutputs["ticket"]["getById"];

interface TicketDetailSheetProps {
  ticketId: string | null;
  onClose: () => void;
}

export function TicketDetailSheet({ ticketId, onClose }: TicketDetailSheetProps) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: ticket, isLoading } = trpc.ticket.getById.useQuery(
    { id: ticketId! },
    { enabled: !!ticketId }
  );

  const archiveMutation = trpc.ticket.archive.useMutation({
    onSuccess: () => {
      toast.success("Ticket archived");
      utils.ticket.getById.invalidate();
      router.refresh();
      onClose();
    },
  });

  const restoreMutation = trpc.ticket.restore.useMutation({
    onSuccess: () => {
      toast.success("Ticket restored");
      utils.ticket.getById.invalidate();
      router.refresh();
    },
  });

  if (!ticketId) return null;

  return (
    <Sheet open={!!ticketId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {isLoading || !ticket ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading ticket...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <SheetHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="font-mono text-xs">
                  {ticket.project.key}-{ticket.number}
                </Badge>
                <div className="flex items-center gap-1">
                  {ticket.archivedAt ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreMutation.mutate({ id: ticket.id })}
                      disabled={restoreMutation.isPending}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" />
                      Restore
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => archiveMutation.mutate({ id: ticket.id })}
                      disabled={archiveMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Archive className="mr-1 h-3.5 w-3.5" />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
              <SheetTitle className="text-left">
                <TicketTitleEditor ticket={ticket} />
              </SheetTitle>
            </SheetHeader>

            {/* Metadata sidebar fields */}
            <TicketSidebar ticket={ticket} />

            <Separator />

            {/* Description */}
            <TicketDescriptionEditor ticket={ticket} />

            <Separator />

            {/* Labels */}
            <LabelSelect ticketId={ticket.id} currentLabels={ticket.labels} />

            {/* Tabs: Comments / Activity / Attachments */}
            <Tabs defaultValue="comments" className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="comments" className="flex-1">
                  Comments ({ticket.comments.length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">
                  Activity ({ticket.activities.length})
                </TabsTrigger>
                <TabsTrigger value="files" className="flex-1">
                  Files ({ticket.attachments.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="comments" className="mt-3">
                <CommentList ticketId={ticket.id} initialComments={ticket.comments} />
              </TabsContent>
              <TabsContent value="activity" className="mt-3">
                <ActivityFeed activities={ticket.activities} />
              </TabsContent>
              <TabsContent value="files" className="mt-3">
                <AttachmentList
                  ticketId={ticket.id}
                  attachments={ticket.attachments}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
