"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribe to real-time changes for a poker session via Supabase Realtime.
 * Listens for INSERTs/UPDATEs on estimation_sessions, estimation_participants, estimation_votes.
 * Triggers a refetch callback whenever changes are detected.
 */
export function useRealtimePoker(sessionId: string, onUpdate: () => void) {
  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`poker-${sessionId}`)
      // Listen for session status changes (VOTING -> REVEALED, active story change)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estimation_sessions", filter: `id=eq.${sessionId}` },
        () => onUpdate()
      )
      // Listen for new participants joining
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "estimation_participants", filter: `session_id=eq.${sessionId}` },
        () => onUpdate()
      )
      // Listen for votes (insert and update)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "estimation_votes", filter: `session_id=eq.${sessionId}` },
        () => onUpdate()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, onUpdate]);
}
