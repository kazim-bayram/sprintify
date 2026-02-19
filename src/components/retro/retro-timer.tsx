"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

const TOTAL_SECONDS = 45 * 60; // 45 minutes

export function RetroTimer() {
  const [remaining, setRemaining] = useState(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const toggle = useCallback(() => setIsRunning((r) => !r), []);
  const reset = useCallback(() => {
    setRemaining(TOTAL_SECONDS);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const isLow = remaining <= 300; // 5 min
  const isZero = remaining === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-2 font-mono text-xl font-bold tabular-nums",
        isZero && "border-destructive bg-destructive/10 text-destructive",
        isLow && !isZero && "border-amber-500 bg-amber-500/10 text-amber-600",
        !isLow && !isZero && "border-border bg-muted/50"
      )}
    >
      <span>{formatTime(remaining)}</span>
      <Button
        variant={isRunning ? "secondary" : "default"}
        size="icon-sm"
        onClick={toggle}
        aria-label={isRunning ? "Pause" : "Start"}
      >
        {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
      {isZero && (
        <Button variant="outline" size="xs" onClick={reset}>
          Reset
        </Button>
      )}
    </div>
  );
}
