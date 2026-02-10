"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { BarChart3, Users, ArrowRight, Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function PokerHub() {
  const router = useRouter();
  const projectsQuery = trpc.project.list.useQuery();

  // Create Session state
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [sessionName, setSessionName] = useState("");

  // Join Session state
  const [joinCode, setJoinCode] = useState("");

  const createSession = trpc.poker.createSession.useMutation({
    onSuccess: (session) => {
      toast.success(`Session created! Code: ${session.accessCode}`);
      router.push(`/poker/${session.accessCode}`);
    },
    onError: (err) => toast.error(err.message),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) {
      toast.error("Please select a project.");
      return;
    }
    const project = projectsQuery.data?.find((p) => p.id === selectedProjectId);
    createSession.mutate({
      projectId: selectedProjectId,
      name: sessionName.trim() || `${project?.key ?? ""} Estimation`,
    });
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    router.push(`/poker/${code}`);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Planning Poker</h1>
        <p className="text-sm text-muted-foreground">
          Run real-time estimation sessions with your team. Vote on Story Points, Business Value, Time Criticality, and Risk.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 max-w-3xl">
        {/* Create New Session */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Create Session</CardTitle>
                <CardDescription>Start a new estimation round as Host.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projectsQuery.data?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">{p.key}</Badge>
                          {p.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Session Name (optional)</Label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Sprint 5 Estimation"
                />
              </div>
              <Button type="submit" className="w-full" disabled={createSession.isPending || !selectedProjectId}>
                <BarChart3 className="mr-2 h-4 w-4" />
                {createSession.isPending ? "Creating..." : "Start Session"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Join Existing Session */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Join Session</CardTitle>
                <CardDescription>Enter an access code to join a room.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Access Code</Label>
                <Input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g., X4K9M2"
                  className="font-mono text-lg tracking-widest text-center"
                  maxLength={10}
                  autoFocus
                />
              </div>
              <Button type="submit" variant="outline" className="w-full" disabled={!joinCode.trim()}>
                Join Room <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Or share the link: <span className="font-mono">sprintify.app/poker/CODE</span>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
