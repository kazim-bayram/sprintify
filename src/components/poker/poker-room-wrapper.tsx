"use client";

import { trpc } from "@/trpc/client";
import { useGuest } from "./guest-context";
import { GuestJoinScreen } from "./guest-join-screen";
import { PokerRoom } from "./poker-room";
import { Loader2 } from "lucide-react";

export function PokerRoomWrapper({ accessCode }: { accessCode: string }) {
  const { guest } = useGuest();
  const sessionQuery = trpc.poker.getByCode.useQuery(
    { accessCode },
    { refetchInterval: 3000 } // Poll every 3s for real-time updates
  );

  if (sessionQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessionQuery.error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Session Not Found</h2>
          <p className="text-muted-foreground">Code &quot;{accessCode}&quot; does not match any active session.</p>
        </div>
      </div>
    );
  }

  const session = sessionQuery.data;
  if (!session) return null;

  // Check if guest has already joined this session
  const myParticipant = guest
    ? session.participants.find((p) => p.guestId === guest.guestId)
    : null;

  // If not joined yet, show join screen
  if (!guest || !myParticipant) {
    return <GuestJoinScreen accessCode={accessCode} session={session} />;
  }

  return (
    <PokerRoom
      session={session}
      participantId={myParticipant.id}
      isHost={myParticipant.isHost}
      accessCode={accessCode}
    />
  );
}
