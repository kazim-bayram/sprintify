"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface GuestIdentity {
  guestId: string;
  guestName: string;
}

interface GuestContextValue {
  guest: GuestIdentity | null;
  setGuest: (name: string) => GuestIdentity;
  clearGuest: () => void;
}

const GuestContext = createContext<GuestContextValue | null>(null);

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used within GuestProvider");
  return ctx;
}

function generateGuestId() {
  return "guest_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
}

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guest, setGuestState] = useState<GuestIdentity | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("sprintify_guest");
      if (stored) {
        const parsed = JSON.parse(stored) as GuestIdentity;
        if (parsed.guestId && parsed.guestName) {
          setGuestState(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  function setGuest(name: string): GuestIdentity {
    const existing = guest?.guestId ?? generateGuestId();
    const identity: GuestIdentity = { guestId: existing, guestName: name };
    setGuestState(identity);
    try {
      localStorage.setItem("sprintify_guest", JSON.stringify(identity));
    } catch {
      // localStorage not available
    }
    return identity;
  }

  function clearGuest() {
    setGuestState(null);
    try {
      localStorage.removeItem("sprintify_guest");
    } catch {
      // Ignore
    }
  }

  return (
    <GuestContext.Provider value={{ guest, setGuest, clearGuest }}>
      {children}
    </GuestContext.Provider>
  );
}
