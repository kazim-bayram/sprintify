"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FolderKanban, Settings, Users, Zap, Command, Kanban,
  ListTodo, Timer, Layers, Package, Shield, Grid3X3, BarChart3, GanttChart,
  FileText, Map, Home, type LucideIcon,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { trpc } from "@/trpc/client";
import { Badge } from "@/components/ui/badge";

// ─── Global Navigation ──────────────────────────────────────────────────────

const navigation = [
  { name: "Programs", href: "/programs", icon: Layers },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Planning Poker", href: "/poker", icon: BarChart3 },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Members", href: "/settings/members", icon: Users },
  { name: "Admin", href: "/admin/settings", icon: Shield },
  { name: "Settings", href: "/settings", icon: Settings },
];

// ─── Methodology-Based Menu Configs ─────────────────────────────────────────

interface NavItem {
  name: string;
  segment: string; // appended to /projects/[slug]/
  icon: LucideIcon;
}

const AGILE_NAV: NavItem[] = [
  { name: "Overview", segment: "overview", icon: Home },
  { name: "Sprint Board", segment: "board", icon: Kanban },
  { name: "Product Backlog", segment: "product-backlog", icon: Package },
  { name: "Backlog List", segment: "backlog", icon: ListTodo },
  { name: "Active Sprint", segment: "sprints", icon: Timer },
  { name: "Planning Grid", segment: "planner", icon: Grid3X3 },
];

const HYBRID_NAV: NavItem[] = [
  { name: "Overview", segment: "overview", icon: Home },
  { name: "Timeline", segment: "timeline", icon: GanttChart },
  { name: "Sprint Board", segment: "board", icon: Kanban },
  { name: "Product Backlog", segment: "product-backlog", icon: Package },
  { name: "Backlog List", segment: "backlog", icon: ListTodo },
  { name: "Sprints", segment: "sprints", icon: Timer },
  { name: "Roadmap", segment: "planner", icon: Map },
];

const WATERFALL_NAV: NavItem[] = [
  { name: "Overview", segment: "overview", icon: Home },
  { name: "Gantt Chart", segment: "timeline", icon: GanttChart },
  { name: "Documents", segment: "waterfall-notice", icon: FileText },
];

const NAV_BY_METHODOLOGY: Record<string, NavItem[]> = {
  AGILE: AGILE_NAV,
  HYBRID: HYBRID_NAV,
  WATERFALL: WATERFALL_NAV,
};

const METHODOLOGY_LABELS: Record<string, { label: string; color: string }> = {
  AGILE: { label: "Agile", color: "text-blue-600 bg-blue-500/10" },
  HYBRID: { label: "Hybrid", color: "text-violet-600 bg-violet-500/10" },
  WATERFALL: { label: "Waterfall", color: "text-amber-600 bg-amber-500/10" },
};

// ─── Component ──────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();

  // Extract the project slug from the URL
  const projectMatch = pathname.match(/^\/projects\/([^/]+)(?:\/|$)/);
  const projectSlug = projectMatch?.[1];

  // Fetch methodology only when inside a project context
  const methodologyQuery = trpc.project.getMethodology.useQuery(
    { key: projectSlug?.toUpperCase() ?? "" },
    { enabled: !!projectSlug },
  );

  const methodology = methodologyQuery.data?.methodology ?? null;
  const projectName = methodologyQuery.data?.name;

  // Build context-aware sub-navigation
  const projectSubNav = projectSlug && methodology
    ? (NAV_BY_METHODOLOGY[methodology] ?? AGILE_NAV).map((item) => ({
        name: item.name,
        href: `/projects/${projectSlug}/${item.segment}`,
        icon: item.icon,
      }))
    : projectSlug
      // Still loading — show a minimal skeleton set
      ? AGILE_NAV.slice(0, 3).map((item) => ({
          name: item.name,
          href: `/projects/${projectSlug}/${item.segment}`,
          icon: item.icon,
        }))
      : [];

  const metaInfo = methodology ? METHODOLOGY_LABELS[methodology] : null;

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-sidebar">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => {
          const isActive =
            item.href === "/projects"
              ? pathname === "/projects"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        {/* Context-aware project sub-navigation */}
        {projectSubNav.length > 0 && (
          <>
            <div className="my-2 border-t" />
            <div className="flex items-center justify-between px-3 mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate max-w-[120px]">
                {projectName ?? projectSlug?.toUpperCase()}
              </p>
              {metaInfo && (
                <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 font-semibold", metaInfo.color)}>
                  {metaInfo.label}
                </Badge>
              )}
            </div>
            {projectSubNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 space-y-2">
        <div className="flex items-center gap-2 px-3 text-xs text-muted-foreground">
          <Command className="h-3 w-3" />
          <span>
            <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">⌘K</kbd> to search
          </span>
        </div>
        <p className="px-3 text-xs text-muted-foreground">{APP_NAME} v0.8.0 — Context-Aware</p>
      </div>
    </aside>
  );
}
