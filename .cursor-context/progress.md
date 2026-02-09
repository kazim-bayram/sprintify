# Sprintify - Progress Tracker

> **Purpose**: Living status tracker mirroring `plan.md`. Updated as work progresses.

---

## Current Context / Focus

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 3 DONE — Agile Engine (DnD, Sprints, Burndown, Real-Time) complete |
| **Active Work** | None — awaiting next instruction |
| **Blockers** | Supabase project setup needed to run locally (external) |
| **Next Milestone** | Phase 4: Collaboration & Polish (Notifications, GitHub, Share Links, Gamification) |
| **Last Updated** | 2026-02-09 |

---

## Phase 0: Discovery & Decision-Making `DONE`

- [x] **Epic 0.1: Discovery** `DONE`
- [x] **Epic 0.2: Architectural Decisions** `DONE` (11 ADRs)
- [ ] **Epic 0.3: Research** `IN_PROGRESS` (some items remain)

---

## Phase 1: Architecture & Walking Skeleton `DONE`

- [x] **Epic 1.1: Project Scaffolding** `DONE`
- [x] **Epic 1.2: Database Foundation** `DONE`
- [x] **Epic 1.3: Authentication** `DONE`
- [x] **Epic 1.4: API Layer Foundation** `DONE`
- [x] **Epic 1.5: Walking Skeleton UI** `DONE`
- [x] **Epic 1.6: CI/CD & Deployment** `DONE`

---

## Phase 2: Core Domain — Ticket CRUD `DONE`

- [x] **Epic 2.1: Ticket Model (Full CRUD)** `DONE`
- [x] **Epic 2.2: Labels, Priority & Categorization** `DONE`
- [x] **Epic 2.3: Comments & Activity Feed** `DONE`
- [x] **Epic 2.4: File Attachments** `DONE`
- [x] **Epic 2.5: User & Member Management** `DONE`
- [x] **Epic 2.6: Search & Filtering** `DONE`

---

## Phase 3: The Agile Engine `DONE`

- [x] **Epic 3.1: Kanban Board (Drag & Drop)** `DONE`
  - [x] @dnd-kit/core + @dnd-kit/sortable for drag-and-drop
  - [x] Semi-fixed columns with drop zones (`useDroppable`)
  - [x] Column rename via double-click (stored in DB)
  - [x] Drag tickets between columns → optimistic UI + server mutation
  - [x] Drag to reorder within column (position tracked)
  - [x] Card preview: ticket key, title, priority badge, assignee avatar, story points
  - [x] DragOverlay with rotated card preview while dragging
  - [x] Confetti animation when ticket moves to "Done" column (canvas-confetti)
  - [x] SortableTicketCard wrapper for individual card dragging

- [x] **Epic 3.2: Sprint Management** `DONE`
  - [x] Sprint model: name, goal, startDate, endDate, status (PLANNING/ACTIVE/CLOSED)
  - [x] SprintSnapshot model for daily burndown data
  - [x] `sprintId` on Ticket for sprint assignment
  - [x] Sprint router: list, getActive, getById, create, start, close, recordSnapshot
  - [x] Start sprint validates one active per project, sets dates, creates initial snapshot
  - [x] Sprint bar on board: shows active sprint progress, days remaining, burndown button

- [x] **Epic 3.3: Sprint Planning & Backlog** `DONE`
  - [x] Backlog page (`/projects/[slug]/backlog`) showing unassigned-to-sprint tickets
  - [x] Backlog sorted by priority (Urgent first)
  - [x] Capacity indicator: total backlog points displayed
  - [x] "Add to sprint" selector on each backlog ticket (active or planning sprints)
  - [x] Active sprint indicator on backlog page

- [x] **Epic 3.4: Sprint Rollover** `DONE`
  - [x] Close Sprint modal with per-ticket decision (Move to Next Sprint / Move to Backlog)
  - [x] Per-ticket choice (not bulk — forces acknowledgment per discovery)
  - [x] Auto-create next sprint if "Move to Next Sprint" chosen and none exists
  - [x] Final snapshot recorded on close
  - [x] Confetti celebration on sprint close
  - [x] Sprint history page (`/projects/[slug]/sprints`) with completion stats

- [x] **Epic 3.5: Burndown Chart** `DONE`
  - [x] SprintSnapshot model stores {date, totalPoints, completedPoints}
  - [x] Burndown dialog with recharts LineChart (Ideal vs. Actual Remaining)
  - [x] Sprint summary stats: total points, completed, remaining
  - [x] Velocity display on sprint history page: average across last 3 sprints

- [x] **Epic 3.6: Real-Time Board Sync** `DONE`
  - [x] `useRealtimeBoard` hook subscribing to Supabase Realtime on tickets table
  - [x] Filtered by project_id for efficient subscriptions
  - [x] Auto-refresh board on INSERT/UPDATE/DELETE events
  - [x] Presence tracking: channel.track() for viewers on the board
  - [x] Presence state sync for showing who's viewing the board

---

## Phase 4: Collaboration & Polish `TODO`

- [ ] **Epic 4.1: Notification System** `TODO`
- [ ] **Epic 4.2: GitHub Integration** `TODO`
- [ ] **Epic 4.3: Public Share Links** `TODO`
- [ ] **Epic 4.4: UX & Gamification Polish** `TODO`

---

## Phase 5: Scale & Ecosystem `TODO`

- [ ] **Epic 5.1: Public API & Webhooks** `TODO`
- [ ] **Epic 5.2: Advanced Reporting** `TODO`
- [ ] **Epic 5.3: Enterprise Features** `TODO`

---

## Completion Summary

| Phase | Total Epics | Done | In Progress | Blocked | TODO |
|-------|-------------|------|-------------|---------|------|
| Phase 0 | 3 | 2 | 1 | 0 | 0 |
| Phase 1 | 6 | 6 | 0 | 0 | 0 |
| Phase 2 | 6 | 6 | 0 | 0 | 0 |
| Phase 3 | 6 | 6 | 0 | 0 | 0 |
| Phase 4 | 4 | 0 | 0 | 0 | 4 |
| Phase 5 | 3 | 0 | 0 | 0 | 3 |
