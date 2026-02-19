"use client";

import { DemoBanner } from "./demo-banner";
import { DemoGuideToast } from "./demo-guide-toast";

/**
 * Renders demo banner (sticky bar) and one-time guide toast when user is in a demo session.
 * Include this in the dashboard layout so it shows after redirect from /demo.
 */
export function DemoUXWrapper({ isDemoUser }: { isDemoUser?: boolean }) {
  return (
    <>
      <DemoBanner isDemoUser={isDemoUser} />
      <DemoGuideToast />
    </>
  );
}
