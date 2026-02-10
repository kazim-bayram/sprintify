import { GuestProvider } from "@/components/poker/guest-context";

/**
 * Poker room layout — wraps with GuestProvider for localStorage-based guest identity.
 * No sidebar/topbar — this is a standalone collaborative page.
 */
export default function PokerLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestProvider>
      <div className="min-h-screen bg-background">{children}</div>
    </GuestProvider>
  );
}
