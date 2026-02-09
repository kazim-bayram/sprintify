# Sprintify - Agent Active Memory

> **IMPORTANT: ALWAYS read this file first at the start of every session.**
>
> This file is the agent's "working memory." It prevents context loss across sessions and ensures continuity.

---

## Instructions for the Agent

1. **READ THIS FILE FIRST** before doing any work on Sprintify.
2. **UPDATE THIS FILE** whenever:
   - A new architectural decision is made (update Tech Stack, Architecture sections).
   - A phase or epic is completed (update Current Status).
   - The focus shifts to a new area of work (update Current Focus).
3. **CROSS-REFERENCE** with other `.cursor-context/` files:
   - `discovery.md` — Scope & requirements (25/25 answered)
   - `research.md` — Domain research findings
   - `plan.md` — Master execution plan (Phases > Epics > Tasks)
   - `progress.md` — Detailed status tracker
   - `decisions.md` — 15 Architectural Decision Records

---

## Project Overview

| Field | Value |
|-------|-------|
| **Project Name** | Sprintify |
| **Description** | Open-source Agile project management web app — keyboard-first, gamified velocity, frictionless flow |
| **Business Model** | Freemium (free for ≤10 users/10 projects, paid Enterprise tier later) |
| **Repository** | sprintify-main |
| **Created** | 2026-02-09 |
| **Current Phase** | Phase 3 DONE → Phase 4 ready to begin |

---

## Current Status

- **Phase**: 3 Complete. Agile Engine (DnD Kanban, Sprints, Burndown, Real-Time) all built.
- **Active Work**: None — awaiting next instruction.
- **Blockers**: Supabase project setup needed for local dev + Realtime testing (external task).
- **Next Step**: Phase 4 — Collaboration & Polish (Notifications, GitHub, Share Links, Gamification).

---

## Tech Stack (Installed & Verified)

| Layer | Technology | Version | Decision Ref |
|-------|------------|---------|-------------|
| **Framework** | Next.js (App Router, TypeScript) | 16.1.6 | ADR-002 |
| **Styling** | Tailwind CSS v4 + shadcn/ui (new-york) | 4.x | ADR-002 |
| **State (Client)** | TanStack Query (via tRPC) | 5.x | ADR-002, ADR-006 |
| **API** | tRPC v11 (internal only) | 11.0.0 | ADR-010 |
| **Database** | PostgreSQL (Supabase) | — | ADR-003 |
| **ORM** | Prisma 7 (`prisma-client-js` for Turbopack compat) | 7.3.0 | ADR-003 |
| **DB Adapter** | `@prisma/adapter-pg` + `pg` | — | ADR-003 |
| **Auth** | Supabase Auth (`@supabase/ssr`) | 0.8.0 | ADR-005 |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable | latest | ADR-014 |
| **Charts** | recharts | latest | ADR-014 |
| **Gamification** | canvas-confetti | latest | ADR-014 |
| **Real-Time** | Supabase Realtime (wired in Phase 3) | — | ADR-006 |
| **File Storage** | Supabase Storage (client-side upload ready, bucket TBD) | — | ADR-011 |
| **Hosting** | Vercel (auto-deploy from Git) | — | ADR-009 |

---

## Architecture Summary

**Pattern**: Modular Monolith (Next.js full-stack)

**Multi-Tenancy**: Shared PostgreSQL DB with Row-Level Security (RLS).

**Data Model**: Hybrid Relational + JSONB. 14 models total.

**Real-Time**: Supabase Realtime wired for board sync + presence tracking.
- `useRealtimeBoard` hook subscribes to `tickets` table changes filtered by project.
- Presence tracking via Supabase channel for viewer indicators.
- Auto-refresh server data on any change.

**Drag & Drop**: @dnd-kit with optimistic UI.
- DndContext wraps board, closestCorners collision detection.
- SortableContext per column, SortableTicketCard for individual items.
- DragOverlay for floating card preview.
- Confetti on ticket → Done column.

---

## Database Schema (Phase 3 Complete)

**Models** (14 total): User, Organization, Membership, Project, BoardColumn, Sprint, SprintSnapshot, Ticket, Label, TicketLabel, Comment, Activity, Attachment

**New in Phase 3**:
- `Sprint` — name, goal, startDate, endDate, status (PLANNING/ACTIVE/CLOSED), projectId
- `SprintSnapshot` — date, totalPoints, completedPoints, sprintId (for burndown)
- `sprintId` added to Ticket for sprint assignment

---

## tRPC Routers (Phase 3 Complete)

| Router | Procedures |
|--------|-----------|
| `project` | `list`, `getByKey`, `create`, `renameColumn` |
| `ticket` | `getById`, `create`, `update`, `move`, `archive`, `restore` |
| `organization` | `list`, `create`, `getMembers` |
| `comment` | `list`, `create`, `update`, `delete` |
| `label` | `list`, `create`, `delete`, `addToTicket`, `removeFromTicket` |
| `member` | `list`, `invite`, `updateRole`, `remove` |
| `search` | `global`, `filterTickets` |
| `sprint` | `list`, `getActive`, `getById`, `create`, `start`, `close`, `getIncompleteTickets`, `rollover`, `history`, `recordSnapshot` |

---

## Pages (15 routes)

| Route | Description |
|-------|-------------|
| `/` | Root redirect (auth check) |
| `/sign-in`, `/sign-up` | Authentication |
| `/onboarding` | First-time org creation |
| `/auth/callback` | OAuth callback |
| `/projects` | Project list |
| `/projects/[slug]/board` | Kanban board (DnD) |
| `/projects/[slug]/backlog` | Backlog grooming |
| `/projects/[slug]/sprints` | Sprint history + velocity |
| `/dashboard` | Dashboard (placeholder) |
| `/settings` | Settings hub |
| `/settings/members` | Member management |
| `/settings/labels` | Label management |
| `/api/trpc/[trpc]` | tRPC handler |

---

## Session Log

| Date | Session Summary |
|------|----------------|
| 2026-02-09 | Project initialized. Created `.cursor-context/` with 6 files. 25 discovery questions generated. |
| 2026-02-09 | All 25 discovery answers received. Synthesized into 11 ADRs. Plan populated with concrete tasks across 5 phases. Ready for Phase 1 scaffolding. |
| 2026-02-09 | Phase 1 COMPLETE. Walking Skeleton built: Next.js 16 + Prisma 7 + tRPC v11 + Supabase Auth + shadcn/ui. All 6 epics done. Build passes. Git initialized. 76 files created. |
| 2026-02-09 | Phase 2 COMPLETE. Core Domain built: Full ticket CRUD, labels, comments, activity feed, attachments, member management, Cmd+K palette, board filters. 20+ files, 3 new models, 7 routers. |
| 2026-02-09 | Phase 3 COMPLETE. Agile Engine built: @dnd-kit Kanban DnD with confetti on Done. Sprint lifecycle (create/start/close/rollover). Per-ticket rollover modal. Backlog view with sprint assignment. Burndown chart (recharts). Sprint history with velocity. Real-time board sync (Supabase Realtime + presence). 2 new models, 3 new pages, sprint router (10 procedures). Build passes with 15 routes. |

---

> **Reminder**: This file is the single fastest way to regain context. Keep it accurate.
