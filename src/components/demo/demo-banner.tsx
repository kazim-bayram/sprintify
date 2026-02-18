"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DEMO_SESSION_KEY = "demo_session";
const DEMO_EXPIRES_KEY = "demo_expires";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function getTimeLeftMs(): number | null {
  const expires = getCookie(DEMO_EXPIRES_KEY);
  if (!expires) return null;
  const ts = parseInt(expires, 10);
  if (Number.isNaN(ts)) return null;
  return Math.max(0, ts - Date.now());
}

function formatCountdown(ms: number): string {
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const s = Math.floor((ms % (60 * 1000)) / 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function DemoBanner() {
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    const session = getCookie(DEMO_SESSION_KEY);
    if (!session) {
      setShow(false);
      return;
    }
    setShow(true);

    const tick = () => {
      const ms = getTimeLeftMs();
      if (ms === null) {
        setCountdown("00:00:00");
        return;
      }
      setCountdown(formatCountdown(ms));
      if (ms <= 0) {
        setShow(false);
        return;
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!show) return null;

  return (
    <div className="sticky top-0 z-50 w-full border-b border-indigo-600/30 bg-indigo-600 px-4 py-2 text-indigo-100 shadow-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">
          You are in a Live Demo Environment.
        </span>
        <div className="flex items-center gap-4">
          {countdown !== null && (
            <span className="text-sm">
              Session resets in: <strong className="font-mono">{countdown}</strong>
            </span>
          )}
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-indigo-600 shadow-sm transition hover:bg-indigo-50"
          >
            Save my progress (Sign Up)
          </Link>
        </div>
      </div>
    </div>
  );
}
