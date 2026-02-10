"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { useGuest } from "./guest-context";
import { APP_NAME } from "@/lib/constants";

interface GuestJoinScreenProps {
  accessCode: string;
  session: {
    id: string;
    name: string;
    project: { name: string; key: string };
    participants: { id: string; name: string; isHost: boolean }[];
  };
}

export function GuestJoinScreen({ accessCode, session }: GuestJoinScreenProps) {
  const { setGuest } = useGuest();
  const [name, setName] = useState("");
  const utils = trpc.useUtils();

  const joinMutation = trpc.poker.joinAsGuest.useMutation({
    onSuccess: () => {
      utils.poker.getByCode.invalidate({ accessCode });
    },
    onError: (err) => toast.error(err.message),
  });

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const identity = setGuest(name.trim());
    joinMutation.mutate({
      accessCode,
      guestName: identity.guestName,
      guestId: identity.guestId,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">{APP_NAME}</CardTitle>
          <CardDescription className="space-y-1">
            <span className="block font-medium text-foreground">{session.name}</span>
            <span className="block">
              Project: <Badge variant="outline" className="font-mono">{session.project.key}</Badge> {session.project.name}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current participants */}
          {session.participants.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
                <Users className="h-3.5 w-3.5" />
                {session.participants.length} participant{session.participants.length !== 1 ? "s" : ""} in room
              </div>
              <div className="flex flex-wrap gap-1.5">
                {session.participants.map((p) => (
                  <Badge key={p.id} variant={p.isHost ? "default" : "secondary"} className="text-xs">
                    {p.name} {p.isHost && "(Host)"}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="guestName">Your Name</Label>
              <Input
                id="guestName"
                placeholder="e.g., Ali, Maria, Team Lead..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                maxLength={50}
              />
            </div>
            <Button type="submit" className="w-full" disabled={joinMutation.isPending || !name.trim()}>
              {joinMutation.isPending ? "Joining..." : "Join Session"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Room Code: <span className="font-mono font-bold">{accessCode}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
