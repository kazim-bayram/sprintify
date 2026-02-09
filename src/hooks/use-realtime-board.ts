"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Subscribes to Supabase Realtime changes on the tickets table
 * filtered by a specific project. When any INSERT/UPDATE/DELETE event
 * fires, the board refreshes to stay in sync.
 *
 * Also tracks presence — which users are viewing the board.
 */
export function useRealtimeBoard(projectId: string, userId?: string) {
  const router = useRouter();
  const supabase = useRef(createClient());
  const [viewers, setViewers] = useState<
    { userId: string; name?: string; avatarUrl?: string }[]
  >([]);

  useEffect(() => {
    const client = supabase.current;

    // Subscribe to ticket changes for this project
    const channel = client
      .channel(`board:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tickets",
          filter: `project_id=eq.${projectId}`,
        },
        (_payload) => {
          // Refresh the page to get new data via server component
          router.refresh();
        }
      );

    // Presence tracking
    if (userId) {
      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const presentUsers = Object.values(state)
            .flat()
            .map((p: Record<string, unknown>) => ({
              userId: p.userId as string,
              name: p.name as string | undefined,
              avatarUrl: p.avatarUrl as string | undefined,
            }))
            .filter(
              (v, i, arr) => arr.findIndex((a) => a.userId === v.userId) === i
            );
          setViewers(presentUsers);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({ userId });
          }
        });
    } else {
      channel.subscribe();
    }

    return () => {
      client.removeChannel(channel);
    };
  }, [projectId, userId, router]);

  return { viewers };
}
