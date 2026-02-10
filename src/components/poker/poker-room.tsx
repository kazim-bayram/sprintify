"use client";

import type { AppRouter } from "@/server/trpc/router";
import type { inferRouterOutputs } from "@trpc/server";
import { trpc } from "@/trpc/client";
import { useRealtimePoker } from "@/hooks/use-realtime-poker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Eye, Check, SkipForward, Copy, BarChart3,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { POKER_CARDS, VOTING_TYPES, DEPARTMENTS } from "@/lib/constants";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type SessionData = RouterOutputs["poker"]["getByCode"];

interface PokerRoomProps {
  session: SessionData;
  participantId: string;
  isHost: boolean;
  accessCode: string;
}

export function PokerRoom({ session, participantId, isHost, accessCode }: PokerRoomProps) {
  const utils = trpc.useUtils();
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  // Real-time updates via Supabase
  const refetch = useCallback(() => {
    utils.poker.getByCode.invalidate({ accessCode });
  }, [utils, accessCode]);
  useRealtimePoker(session.id, refetch);

  // Backlog for host to pick stories
  const backlogQuery = trpc.poker.getBacklog.useQuery(
    { sessionId: session.id },
    { enabled: isHost }
  );

  // Mutations
  const selectStoryMutation = trpc.poker.selectStory.useMutation({ onSuccess: refetch, onError: (e) => toast.error(e.message) });
  const setVotingTypeMutation = trpc.poker.setVotingType.useMutation({ onSuccess: refetch });
  const voteMutation = trpc.poker.vote.useMutation({
    onSuccess: refetch,
    onError: (e) => toast.error(e.message),
  });
  const revealMutation = trpc.poker.reveal.useMutation({ onSuccess: refetch });
  const applyMutation = trpc.poker.applyScore.useMutation({
    onSuccess: () => { toast.success("Score applied!"); refetch(); setSelectedCard(null); },
    onError: (e) => toast.error(e.message),
  });

  // Derived state
  const isVoting = session.status === "VOTING";
  const isRevealed = session.status === "REVEALED";
  const activeStory = session.activeStory;
  const votes = session.votes ?? [];
  const myVote = votes.find((v) => v.participantId === participantId);
  const votingTypeInfo = VOTING_TYPES.find((vt) => vt.value === session.votingType) ?? VOTING_TYPES[0];
  const allVoted = votes.length >= session.participants.length;

  // Calculate stats
  const stats = useMemo(() => {
    if (votes.length === 0) return null;
    const values = votes.map((v) => v.value);
    const avg = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Mode (most frequent)
    const freq: Record<number, number> = {};
    values.forEach((v) => { freq[v] = (freq[v] ?? 0) + 1; });
    const maxFreq = Math.max(...Object.values(freq));
    const mode = Number(Object.entries(freq).find(([, f]) => f === maxFreq)?.[0] ?? avg);
    const consensus = min === max;
    return { avg, min, max, mode, consensus };
  }, [votes]);

  function handleVote(value: number) {
    if (!activeStory || !isVoting) return;
    setSelectedCard(value);
    voteMutation.mutate({
      sessionId: session.id,
      participantId,
      storyId: activeStory.id,
      value,
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/poker/${accessCode}`);
    toast.success("Link copied!");
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3 bg-background">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-base font-bold">{session.name}</h1>
            <p className="text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono mr-1">{session.project.key}</Badge>
              {session.project.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Voting type selector (host only) */}
          {isHost && (
            <Select
              value={session.votingType}
              onValueChange={(v) => setVotingTypeMutation.mutate({ sessionId: session.id, votingType: v as any })}
            >
              <SelectTrigger className="w-44 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOTING_TYPES.map((vt) => (
                  <SelectItem key={vt.value} value={vt.value} className="text-xs">{vt.label} — {vt.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" /> {session.participants.length}
          </Badge>

          <Button size="sm" variant="outline" onClick={copyLink}>
            <Copy className="h-3.5 w-3.5 mr-1" /> {accessCode}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Host backlog (or active story for participants) */}
        {isHost && (
          <aside className="w-72 border-r overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b">
              <p className="text-xs font-semibold text-muted-foreground">Backlog — Pick a Story</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {backlogQuery.data?.map((story) => {
                  const dept = DEPARTMENTS.find((d) => d.value === story.department);
                  const isActive = activeStory?.id === story.id;
                  return (
                    <button
                      key={story.id}
                      onClick={() => selectStoryMutation.mutate({ sessionId: session.id, storyId: story.id })}
                      className={`w-full text-left rounded-md border px-3 py-2 text-xs transition-colors hover:bg-muted/50 ${isActive ? "border-primary bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-muted-foreground">#{story.number}</span>
                        {dept && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dept.color }} />}
                      </div>
                      <p className="font-medium line-clamp-2">{story.title}</p>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Center: Voting area */}
        <main className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {/* Active Story Card */}
          {activeStory ? (
            <Card className="w-full max-w-lg">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">#{activeStory.number} — {activeStory.title}</CardTitle>
                  <Badge>{votingTypeInfo.label}</Badge>
                </div>
                {activeStory.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{activeStory.description}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Points: {activeStory.storyPoints ?? "—"}</span>
                  <span>Value: {activeStory.userBusinessValue}</span>
                  <span>Criticality: {activeStory.timeCriticality}</span>
                  <span>Risk: {activeStory.riskReduction}</span>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Waiting for host to select a story...</p>
              <p className="text-sm">The host will pick a story from the backlog to vote on.</p>
            </div>
          )}

          {/* Voting Cards */}
          {isVoting && activeStory && (
            <div className="flex flex-wrap justify-center gap-3">
              {POKER_CARDS.map((card) => {
                const isSelected = (myVote?.value ?? selectedCard) === card;
                return (
                  <button
                    key={card}
                    onClick={() => handleVote(card)}
                    className={`flex h-24 w-16 items-center justify-center rounded-xl border-2 text-xl font-bold transition-all hover:scale-105 hover:shadow-lg ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground scale-110 shadow-lg"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    {card}
                  </button>
                );
              })}
            </div>
          )}

          {/* Revealed Results */}
          {isRevealed && stats && (
            <Card className="w-full max-w-lg">
              <CardContent className="pt-6">
                <div className="grid grid-cols-4 gap-4 text-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-primary">{stats.avg}</p>
                    <p className="text-[10px] text-muted-foreground">Average</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.mode}</p>
                    <p className="text-[10px] text-muted-foreground">Most Common</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.min}</p>
                    <p className="text-[10px] text-muted-foreground">Min</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.max}</p>
                    <p className="text-[10px] text-muted-foreground">Max</p>
                  </div>
                </div>

                {stats.consensus && (
                  <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-2 text-center text-sm text-green-700 dark:text-green-400 font-medium mb-4">
                    Consensus reached!
                  </div>
                )}

                {/* Individual votes */}
                <div className="space-y-1.5">
                  {session.participants.map((p) => {
                    const vote = votes.find((v) => v.participantId === p.id);
                    return (
                      <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                        <span className="font-medium">{p.name} {p.isHost && <Badge variant="outline" className="text-[8px] ml-1">Host</Badge>}</span>
                        <Badge variant={vote ? "default" : "secondary"} className="text-xs">
                          {vote ? vote.value : "—"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>

                {/* Host: Apply score */}
                {isHost && activeStory && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      className="flex-1"
                      onClick={() => applyMutation.mutate({
                        sessionId: session.id,
                        storyId: activeStory.id,
                        value: Math.round(stats.avg),
                      })}
                      disabled={applyMutation.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Apply Average ({Math.round(stats.avg)})
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => applyMutation.mutate({
                        sessionId: session.id,
                        storyId: activeStory.id,
                        value: stats.mode,
                      })}
                      disabled={applyMutation.isPending}
                    >
                      Apply Mode ({stats.mode})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Host: Reveal button */}
          {isHost && isVoting && (
            <div className="flex gap-3">
              <Button
                size="lg"
                onClick={() => revealMutation.mutate({ sessionId: session.id })}
                disabled={votes.length === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Reveal Votes ({votes.length}/{session.participants.length})
              </Button>
              {allVoted && (
                <Badge variant="secondary" className="animate-pulse">All voted!</Badge>
              )}
            </div>
          )}
        </main>

        {/* Right: Participants */}
        <aside className="w-56 border-l overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b">
            <p className="text-xs font-semibold text-muted-foreground">Participants</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {session.participants.map((p) => {
              const hasVoted = votes.some((v) => v.participantId === p.id);
              return (
                <div key={p.id} className="flex items-center justify-between rounded-md border px-2.5 py-1.5">
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <div className="flex items-center gap-1">
                    {p.isHost && <Badge variant="outline" className="text-[8px]">Host</Badge>}
                    {isVoting && (
                      hasVoted
                        ? <Check className="h-3.5 w-3.5 text-green-500" />
                        : <span className="h-3.5 w-3.5 rounded-full border-2 border-dashed border-muted-foreground/40" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
