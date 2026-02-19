"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextValue {
  isOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within DashboardShell");
  return ctx;
}

const MOBILE_BREAKPOINT = 768;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  // Default to mobile-like (closed) to avoid flash of open sidebar on mobile
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const mobile = mq.matches;
    setIsMobile(mobile);
    setIsOpen(!mobile);

    const handler = () => {
      const nowMobile = mq.matches;
      setIsMobile(nowMobile);
      if (nowMobile) setIsOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = () => setIsOpen((o) => !o);

  return (
    <SidebarContext.Provider value={{ isOpen, isMobile, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}
