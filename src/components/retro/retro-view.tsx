"use client";

import { useState, useRef } from "react";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RetroTimer } from "./retro-timer";
import { Plus, Check, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const COLUMNS = [
  {
    key: "WENT_WELL" as const,
    label: "Went Well",
    accent: "bg-green-500/10 border-green-500/30 text-green-800",
    addPlaceholder: "What went well?",
  },
  {
    key: "TO_IMPROVE" as const,
    label: "To Improve",
    accent: "bg-amber-500/10 border-amber-500/30 text-amber-800",
    addPlaceholder: "What could be improved?",
  },
  {
    key: "ACTION_ITEM" as const,
    label: "Action Items",
    accent: "bg-blue-500/10 border-blue-500/30 text-blue-800",
    addPlaceholder: "Action item...",
  },
];

type Card = {
  id: string;
  column: "WENT_WELL" | "TO_IMPROVE" | "ACTION_ITEM";
  content: string;
  votes: number;
  convertedStoryId: string | null;
  author: { id: string; name: string | null; avatarUrl: string | null };
};

interface RetroViewProps {
  sprintId: string;
  projectKey: string;
}

export function RetroView({ sprintId, projectKey }: RetroViewProps) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.retro.getBoard.useQuery({ sprintId });
  const addCard = trpc.retro.addCard.useMutation({
    onSuccess: () => utils.retro.getBoard.invalidate({ sprintId }),
    onError: (e) => toast.error(e.message),
  });
  const vote = trpc.retro.vote.useMutation({
    onSuccess: () => utils.retro.getBoard.invalidate({ sprintId }),
    onError: (e) => toast.error(e.message),
  });
  const convertToTask = trpc.retro.convertToTask.useMutation({
    onSuccess: (res) => {
      utils.retro.getBoard.invalidate({ sprintId });
      toast.success("Added to backlog");
    },
    onError: (e) => toast.error(e.message),
  });

  const [newCardInputs, setNewCardInputs] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleAddCard = (column: "WENT_WELL" | "TO_IMPROVE" | "ACTION_ITEM") => {
    const content = newCardInputs[column]?.trim();
    if (!content || addCard.isPending) return;
    addCard.mutate({ sprintId, column, content }, {
      onSuccess: () => {
        setNewCardInputs((p) => ({ ...p, [column]: "" }));
        inputRefs.current[column]?.focus();
      },
    });
  };

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { board, sprint, velocity } = data;
  const cardsByColumn = COLUMNS.reduce(
    (acc, col) => {
      acc[col.key] = (board.cards as Card[]).filter((c) => c.column === col.key);
      return acc;
    },
    {} as Record<string, Card[]>
  );

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Sprint Retrospective</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {projectKey}
            </Badge>
            <span className="text-sm font-medium">{sprint.name}</span>
            <span className="text-sm text-muted-foreground">
              Completed: {velocity.completedPoints} / Planned: {velocity.totalPoints} pts
            </span>
          </div>
        </div>
        <RetroTimer />
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className={cn(
                "flex flex-col rounded-xl border-2",
                col.accent
              )}
            >
              <h2 className="border-b px-4 py-2 text-sm font-semibold">{col.label}</h2>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {(cardsByColumn[col.key] ?? []).map((card) => (
                  <RetroCard
                    key={card.id}
                    card={card}
                    showVote={col.key !== "ACTION_ITEM"}
                    projectKey={projectKey}
                    onVote={() => vote.mutate({ cardId: card.id })}
                    onConvert={
                      col.key === "ACTION_ITEM"
                        ? () => convertToTask.mutate({ cardId: card.id })
                        : undefined
                    }
                    convertPending={convertToTask.isPending}
                  />
                ))}
              </div>
              <div className="border-t p-2">
                <div className="flex gap-2">
                  <Input
                    ref={(el) => {
                      inputRefs.current[col.key] = el;
                    }}
                    placeholder={col.addPlaceholder}
                    value={newCardInputs[col.key] ?? ""}
                    onChange={(e) =>
                      setNewCardInputs((p) => ({ ...p, [col.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCard(col.key);
                    }}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={() => handleAddCard(col.key)}
                    disabled={
                      !newCardInputs[col.key]?.trim() || addCard.isPending
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RetroCard({
  card,
  showVote,
  projectKey,
  onVote,
  onConvert,
  convertPending,
}: {
  card: Card;
  showVote: boolean;
  projectKey: string;
  onVote: () => void;
  onConvert?: () => void;
  convertPending: boolean;
}) {
  if (card.convertedStoryId) {
    return (
      <div className="rounded-lg border bg-background/80 p-3 text-sm">
        <p className="line-through text-muted-foreground">{card.content}</p>
        <Link
          href={`/projects/${projectKey.toLowerCase()}/backlog`}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Check className="h-3 w-3" />
          Converted to backlog
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border bg-background/80 p-3 text-sm">
      <p className="min-w-0 flex-1">{card.content}</p>
      <div className="flex shrink-0 items-center gap-1">
        {showVote && (
          <Button
            variant="ghost"
            size="xs"
            className="h-6 px-1.5 text-xs"
            onClick={onVote}
            title="Vote"
          >
            +1
          </Button>
        )}
        {showVote && card.votes > 0 && (
          <span className="text-xs font-medium">👍 {card.votes}</span>
        )}
        {onConvert && (
          <Button
            variant="outline"
            size="xs"
            onClick={onConvert}
            disabled={convertPending}
          >
            Convert to Task
          </Button>
        )}
      </div>
    </div>
  );
}
