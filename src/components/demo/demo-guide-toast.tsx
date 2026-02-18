"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const DEMO_SESSION_KEY = "demo_session";
const DEMO_GUIDE_SEEN_KEY = "demo_guide_seen";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export function DemoGuideToast() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const session = getCookie(DEMO_SESSION_KEY);
    const seen = typeof localStorage !== "undefined" && localStorage.getItem(DEMO_GUIDE_SEEN_KEY);
    if (!session || seen) return;

    fired.current = true;
    localStorage.setItem(DEMO_GUIDE_SEEN_KEY, "1");

    toast.info("Welcome Manager! We have a delay in the Vendor Integration task. Switch to Timeline View to see the impact.", {
      duration: 8000,
      description: "Use the timeline to reschedule dependencies and keep the plan on track.",
    });
  }, []);

  return null;
}
