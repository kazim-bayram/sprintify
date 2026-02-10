"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FolderKanban, Settings, Users, Zap, Command, Kanban, ListTodo, Timer, Layers, Package, Shield, Grid3X3, BarChart3, GanttChart,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const navigation = [
  { name: "Programs", href: "/programs", icon: Layers },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Planning Poker", href: "/poker", icon: BarChart3 },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/settings/members", icon: Users },
  { name: "Admin", href: "/admin/settings", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const projectMatch = pathname.match(/^\/projects\/([^/]+)\//);
  const projectSlug = projectMatch?.[1];

  const projectSubNav = projectSlug
    ? [
        { name: "Sprint Board", href: `/projects/${projectSlug}/board`, icon: Kanban },
        { name: "Timeline", href: `/projects/${projectSlug}/timeline`, icon: GanttChart },
        { name: "Product Backlog", href: `/projects/${projectSlug}/product-backlog`, icon: Package },
        { name: "Planning Grid", href: `/projects/${projectSlug}/planner`, icon: Grid3X3 },
        { name: "Backlog List", href: `/projects/${projectSlug}/backlog`, icon: ListTodo },
        { name: "Sprints", href: `/projects/${projectSlug}/sprints`, icon: Timer },
      ]
    : [];

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const isActive = item.href === "/projects" ? pathname === "/projects" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.name} href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
              <item.icon className="h-4 w-4" />{item.name}
            </Link>
          );
        })}
        {projectSubNav.length > 0 && (
          <>
            <div className="my-2 border-t" />
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{projectSlug?.toUpperCase()}</p>
            {projectSubNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground")}>
                  <item.icon className="h-3.5 w-3.5" />{item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>
      <div className="border-t p-3 space-y-2">
        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
          <Command className="h-3 w-3" />
          <span><kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">⌘K</kbd> to search</span>
        </div>
        <p className="px-3 text-xs text-muted-foreground">{APP_NAME} v0.7.0 — Hybrid Engine</p>
      </div>
    </aside>
  );
}
