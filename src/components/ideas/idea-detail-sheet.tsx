"use client";

import { trpc } from "@/trpc/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Lightbulb, TrendingUp, Target, ExternalLink, Edit, Rocket, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { CreateEditIdeaDialog } from "./create-edit-idea-dialog";
import { PromoteToProjectDialog } from "./promote-to-project-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface IdeaDetailSheetProps {
  ideaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_COLORS = {
  DRAFT: "bg-gray-500/10 text-gray-700 border-gray-300",
  REVIEW: "bg-blue-500/10 text-blue-700 border-blue-300",
  APPROVED: "bg-green-500/10 text-green-700 border-green-300",
  REJECTED: "bg-red-500/10 text-red-700 border-red-300",
} as const;

const STRATEGIC_ALIGNMENT_COLORS = {
  HIGH: "bg-purple-500/10 text-purple-700 border-purple-300",
  MEDIUM: "bg-blue-500/10 text-blue-700 border-blue-300",
  LOW: "bg-gray-500/10 text-gray-700 border-gray-300",
} as const;

export function IdeaDetailSheet({ ideaId, open, onOpenChange }: IdeaDetailSheetProps) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);

  const { data: idea, isLoading } = trpc.idea.getById.useQuery({ id: ideaId }, { enabled: open });

  const updateStatusMutation = trpc.idea.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status updated!");
      utils.idea.list.invalidate();
      utils.idea.getById.invalidate({ id: ideaId });
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.idea.delete.useMutation({
    onSuccess: () => {
      toast.success("Idea deleted!");
      utils.idea.list.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading || !idea) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent>
          <div className="flex items-center justify-center h-full">Loading...</div>
        </SheetContent>
      </Sheet>
    );
  }

  const statusColor = STATUS_COLORS[idea.status];
  const alignmentColor = STRATEGIC_ALIGNMENT_COLORS[idea.strategicAlignment];
  const swot = idea.swotAnalysis as
    | { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] }
    | null;

  const creatorInitials = idea.createdBy?.name
    ? idea.createdBy.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : idea.createdBy?.email?.charAt(0).toUpperCase() ?? "?";

  const canEdit = idea.status !== "APPROVED";
  const canPromote = idea.status === "APPROVED" && !idea.linkedProjectId;
  const canDelete = !idea.linkedProjectId;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <SheetTitle className="text-xl mb-2">{idea.title}</SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={`text-xs font-semibold ${statusColor}`}>
                    {idea.status}
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${alignmentColor}`}>
                    <Target className="mr-1 h-3 w-3" />
                    {idea.strategicAlignment} Strategic Alignment
                  </Badge>
                  {idea.linkedProject && (
                    <Badge variant="outline" className="text-xs text-primary border-primary">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Linked to {idea.linkedProject.key}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button size="sm" variant="outline" onClick={() => setEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {canPromote && (
                  <Button size="sm" onClick={() => setPromoteDialogOpen(true)}>
                    <Rocket className="h-4 w-4 mr-1" />
                    Promote to Project
                  </Button>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this idea?")) {
                        deleteMutation.mutate({ id: ideaId });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Description */}
            {idea.description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.description}</p>
              </div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {idea.expectedROI != null && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Expected ROI</p>
                    <p className="text-lg font-semibold">{idea.expectedROI.toFixed(1)}%</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Lightbulb className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm font-semibold">{format(new Date(idea.createdAt), "MMM d, yyyy")}</p>
                </div>
              </div>
            </div>

            {/* Business Case */}
            {idea.businessCase && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Business Case</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{idea.businessCase}</p>
              </div>
            )}

            {/* SWOT Analysis */}
            {swot && (swot.strengths?.length || swot.weaknesses?.length || swot.opportunities?.length || swot.threats?.length) && (
              <div>
                <h3 className="text-sm font-semibold mb-3">SWOT Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  {swot.strengths && swot.strengths.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-green-700 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {swot.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            • {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {swot.weaknesses && swot.weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-red-700 mb-2">Weaknesses</h4>
                      <ul className="space-y-1">
                        {swot.weaknesses.map((w, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            • {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {swot.opportunities && swot.opportunities.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-blue-700 mb-2">Opportunities</h4>
                      <ul className="space-y-1">
                        {swot.opportunities.map((o, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            • {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {swot.threats && swot.threats.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-orange-700 mb-2">Threats</h4>
                      <ul className="space-y-1">
                        {swot.threats.map((t, i) => (
                          <li key={i} className="text-xs text-muted-foreground">
                            • {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Status Actions */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Status</h3>
              <div className="flex gap-2 flex-wrap">
                {(["DRAFT", "REVIEW", "APPROVED", "REJECTED"] as const).map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={idea.status === status ? "default" : "outline"}
                    onClick={() => {
                      if (idea.status !== status) {
                        updateStatusMutation.mutate({ id: ideaId, status });
                      }
                    }}
                    disabled={updateStatusMutation.isPending || idea.status === status}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Avatar>
                <AvatarImage src={idea.createdBy?.avatarUrl ?? undefined} />
                <AvatarFallback>{creatorInitials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{idea.createdBy?.name ?? idea.createdBy?.email ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground">Created {format(new Date(idea.createdAt), "MMM d, yyyy")}</p>
              </div>
            </div>

            {/* Linked Project */}
            {idea.linkedProject && (
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/projects/${idea.linkedProject!.key.toLowerCase()}`)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Project: {idea.linkedProject.name}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      {editDialogOpen && (
        <CreateEditIdeaDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} ideaId={ideaId} />
      )}

      {/* Promote Dialog */}
      {promoteDialogOpen && (
        <PromoteToProjectDialog
          open={promoteDialogOpen}
          onOpenChange={setPromoteDialogOpen}
          ideaId={ideaId}
          ideaTitle={idea.title}
        />
      )}
    </>
  );
}
