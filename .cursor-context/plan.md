# Sprintify - Master Execution Plan

> **Purpose**: The single source of truth for what we are building, in what order.
>
> **Stack**: Next.js (App Router) · PostgreSQL (Supabase/Neon) · Prisma · tRPC/Server Actions · Supabase Auth · Supabase Realtime · Tailwind + shadcn/ui · Cloudflare R2
>
> **Last Updated**: 2026-02-09

---

## Phase 0: Discovery & Decision-Making ✅
> **Goal**: Answer all 25 discovery questions, complete critical research, and lock in architectural decisions.

### Epic 0.1: Discovery ✅
- All 25 questions answered in `discovery.md`
- Answers synthesized into 11 ADRs in `decisions.md`

### Epic 0.2: Research
- Execute remaining priority research items from `research.md`

### Epic 0.3: Architectural Decisions ✅
- 11 decisions recorded (ADR-001 through ADR-011)

---

## Phase 1: Architecture & Walking Skeleton
> **Goal**: A deployed, end-to-end thin slice — a user can sign in, see an empty project board, and create one ticket. Proves the architecture works.

### Epic 1.1: Project Scaffolding
- [ ] Initialize Next.js project (App Router, TypeScript, ESLint, Prettier)
- [ ] Configure Tailwind CSS + shadcn/ui component library
- [ ] Set up project folder structure (modular monolith: `/app`, `/lib`, `/server`, `/components`, `/prisma`)
- [ ] Configure path aliases (`@/lib`, `@/components`, `@/server`)
- [ ] Initialize Git repo with `.gitignore`, branch strategy (main + feature branches)
- [ ] Add `.env.example` with all required environment variables (documented)

### Epic 1.2: Database Foundation
- [ ] Set up Supabase project (or Neon Postgres instance)
- [ ] Install and configure Prisma ORM
- [ ] Design and create initial schema: `User`, `Organization`, `Membership`, `Project`
- [ ] Add `organization_id` to all tenant-scoped tables
- [ ] Enable Row-Level Security (RLS) policies on Supabase
- [ ] Seed script for development data
- [ ] Run initial migration (`prisma migrate dev`)

### Epic 1.3: Authentication
- [ ] Integrate Supabase Auth (or Clerk)
- [ ] Configure OAuth providers: GitHub, Google
- [ ] Configure email/magic link authentication
- [ ] Create auth middleware (protect routes, extract current user)
- [ ] Sync Supabase auth user → `users` table (webhook or DB trigger)
- [ ] Build sign-in / sign-up pages (shadcn/ui)
- [ ] Build organization creation / onboarding flow (after first sign-in)

### Epic 1.4: API Layer Foundation
- [ ] Set up tRPC (or Server Actions) router structure
- [ ] Create base procedures with auth context injection
- [ ] Implement org-scoped query middleware (auto-filter by `organization_id`)
- [ ] Error handling strategy (typed errors, toast-friendly messages)
- [ ] Set up TanStack Query (React Query) for client-side data fetching + cache

### Epic 1.5: Walking Skeleton UI
- [ ] App shell layout: sidebar navigation, top bar with user avatar/org switcher
- [ ] Empty project dashboard page (`/projects`)
- [ ] Create Project form (name, key/slug, description)
- [ ] Single project page with empty board view (`/projects/[slug]/board`)
- [ ] Create Ticket modal (title, description only — minimal fields)
- [ ] Display one ticket on the board in a column
- [ ] **Milestone**: User signs in → creates project → creates ticket → sees it on board

### Epic 1.6: CI/CD & Deployment
- [ ] Connect repo to Vercel (auto-deploy on push to `main`)
- [ ] Configure preview deployments for feature branches
- [ ] Set up environment variables on Vercel (Supabase URL, keys, etc.)
- [ ] Verify full walking skeleton works in production
- [ ] **Milestone**: Live URL accessible, end-to-end flow works in prod

---

## Phase 2: Core Domain — Ticket CRUD & Project Structure `DONE`
> **Goal**: Full ticket lifecycle. Create, read, update, delete, assign, comment, attach files. The bread and butter.

### Epic 2.1: Ticket Model (Full CRUD) `DONE`
- [x] Expand ticket schema: `priority` as top-level column, full includes on getById
- [x] Ticket detail sheet (slide-over from board with all metadata)
- [x] Inline editing (title click-to-edit, description click-to-edit with save/cancel)
- [x] Delete ticket (soft delete with `archived_at` timestamp + restore)
- [x] Ticket identifier system (project key + auto-increment: `SPRINT-42`)
- [x] Keyboard shortcut: `Cmd+K` command palette for quick ticket creation/navigation

### Epic 2.2: Labels, Priority & Categorization `DONE`
- [x] Priority levels: Urgent, High, Medium, Low, None (top-level `priority` column)
- [x] Labels system: color-coded tags, org-scoped (Label + TicketLabel models)
- [x] Story points selector (Fibonacci: 1, 2, 3, 5, 8) in create + detail views
- [x] Filter bar: filter tickets by text search, assignee, priority
- [x] `filterTickets` tRPC endpoint with assignee, priority, label, sort options

### Epic 2.3: Comments & Activity Feed `DONE`
- [x] Comments table schema (`comment` → `ticket_id`, `user_id`, `body`, `created_at`)
- [x] Activity stream: 13 event types (status, priority, assign, labels, SP, archive, comments)
- [x] Comment CRUD on ticket detail view (create, edit inline, delete)
- [x] Activity timeline on ticket detail view (icon + user + description + relative time)
- [ ] @mention support in comments (stretch — deferred to Phase 4)

### Epic 2.4: File Attachments `DONE`
- [x] Attachment model in schema (name, url, size, mimeType, ticketId, userId)
- [x] Attachment list UI in ticket detail (download link, size display, delete stub)
- [x] Upload button with 10MB client-side validation
- [x] Upload flow placeholder (Supabase Storage bucket setup required externally)

### Epic 2.5: User & Member Management `DONE`
- [x] Invite users to organization (email invite, creates placeholder user)
- [x] Assign roles on invite (Admin, Member, Viewer)
- [x] Member list page (`/settings/members`) with role selector + remove
- [x] Prevents removing last admin (server-side guard)
- [x] Assignee selector on tickets uses org member list

### Epic 2.6: Search & Filtering `DONE`
- [x] Case-insensitive `contains` search on ticket title + description
- [x] Global search (`Cmd+K` → search across tickets, projects, quick actions)
- [x] Board-level filter bar (text search, assignee dropdown, priority dropdown)
- [x] Clear filters button for quick reset

---

## Phase 3: The Agile Engine — Sprints, Boards & Metrics `DONE`
> **Goal**: Sprint planning, Kanban drag-and-drop, velocity tracking, and the sprint rollover UX.

### Epic 3.1: Kanban Board (Drag & Drop) `DONE`
- [x] @dnd-kit/core + @dnd-kit/sortable based Kanban board
- [x] Semi-fixed columns with `useDroppable` drop zones + highlight on hover
- [x] Column rename via double-click (stored in DB via `renameColumn` mutation)
- [x] Drag ticket between columns → optimistic state update + server mutation
- [x] Drag to reorder within column (position tracked)
- [x] Card preview: ticket key, title, priority badge, assignee avatar, story points
- [x] DragOverlay with rotated card preview while dragging
- [x] **Gamification**: confetti animation (canvas-confetti) when card moves to "Done" column

### Epic 3.2: Sprint Management `DONE`
- [x] Sprint model: `name`, `goal`, `start_date`, `end_date`, `status` (PLANNING/ACTIVE/CLOSED)
- [x] SprintSnapshot model for burndown data
- [x] Create sprint dialog UI
- [x] Start sprint (validates dates, enforces one active per project, creates initial snapshot)
- [x] Sprint bar on board showing active sprint progress + days remaining
- [x] `sprintId` on Ticket for sprint assignment

### Epic 3.3: Sprint Planning & Backlog `DONE`
- [x] Backlog page (`/projects/[slug]/backlog`) — tickets NOT in any sprint
- [x] Sorted by priority (Urgent first) with total backlog points
- [x] "Add to sprint" selector per ticket (active or planning sprints)
- [x] Sprint capacity indicator (ticket count per sprint shown)

### Epic 3.4: Sprint Rollover `DONE`
- [x] Close Sprint modal with per-ticket decision (Move to Next Sprint / Move to Backlog)
- [x] Per-ticket choice (not bulk — forces acknowledgment)
- [x] Auto-create next sprint if "Move to Next Sprint" chosen and none exists
- [x] Final snapshot recorded on close, confetti celebration
- [x] Sprint history page (`/projects/[slug]/sprints`) with completion stats + velocity

### Epic 3.5: Burndown Chart `DONE`
- [x] SprintSnapshot model: `{date, totalPoints, completedPoints}` per sprint
- [x] Burndown dialog with recharts LineChart (Ideal line vs. Actual Remaining)
- [x] Sprint summary stats: total points, completed, remaining
- [x] Velocity display on history page: average across last 3 closed sprints

### Epic 3.6: Real-Time Board Sync `DONE`
- [x] `useRealtimeBoard` hook subscribing to Supabase Realtime `postgres_changes`
- [x] Filtered by `project_id` for efficient per-project subscriptions
- [x] Auto-refresh board on INSERT/UPDATE/DELETE events from other users
- [x] Presence tracking via `channel.track()` + presence state sync
- [x] Optimistic UI on DnD + server reconciliation (rollback on mutation error)

---

## Phase 4: Collaboration & Polish (Future)
> **Goal**: Notifications, GitHub integration, share links, and UX polish.

### Epic 4.1: Notification System
- [ ] In-app notifications (ticket assigned to you, mentioned in comment, sprint closing)
- [ ] Notification preferences (per-type toggle)
- [ ] Email digest (daily/weekly summary) — stretch

### Epic 4.2: GitHub Integration
- [ ] OAuth App: connect GitHub account
- [ ] Webhook: listen for push events, detect `Fixes #SPRINT-42` in commit messages
- [ ] Auto-move ticket to "Review" column when PR references it
- [ ] Display linked PRs on ticket detail

### Epic 4.3: Public Share Links
- [ ] Generate shareable read-only board URL (`/share/{token}`)
- [ ] No auth required for viewer
- [ ] Admin can revoke/regenerate link
- [ ] Rate limiting on share endpoints

### Epic 4.4: UX & Gamification Polish
- [ ] Keyboard-first navigation (Cmd+K command palette, arrow keys on board)
- [ ] Animations: card completion (confetti/particles), streak tracking
- [ ] Dark mode (Tailwind `dark:` classes)
- [ ] Responsive design (mobile board view — vertical columns)

---

## Phase 5: Scale & Ecosystem (Future)
> **Goal**: Public API, advanced reporting, and enterprise features.

### Epic 5.1: Public API & Webhooks
- [ ] REST API layer (via trpc-openapi)
- [ ] API key management
- [ ] Rate limiting
- [ ] API documentation (auto-generated from tRPC schema)

### Epic 5.2: Advanced Reporting
- [ ] Cumulative flow diagram
- [ ] Sprint comparison charts
- [ ] Team workload distribution
- [ ] Custom date range reports

### Epic 5.3: Enterprise Features
- [ ] SSO / SAML integration
- [ ] Full audit log (field-level change tracking)
- [ ] Granular permissions (ABAC upgrade from RBAC)
- [ ] Billing integration (Stripe)

---

## Dependency Map

```
Phase 0 (Discovery) ✅
  └── Phase 1 (Walking Skeleton)
        ├── Epic 1.1-1.4 must complete before 1.5
        ├── Epic 1.5 (UI) can parallel with 1.6 (Deploy)
        │
        ├── Phase 2 (Tickets) — can begin once 1.1-1.4 are solid
        │     ├── Epic 2.1-2.2 before 2.3-2.4
        │     └── Epic 2.5 (Members) can parallel with 2.1
        │
        └── Phase 3 (Agile Engine) — depends on Phase 2 tickets
              ├── Epic 3.1 (Board) is the foundation
              ├── Epic 3.2-3.4 (Sprints) depend on 3.1
              ├── Epic 3.5 (Burndown) depends on 3.2
              └── Epic 3.6 (Real-Time) can parallel with 3.2-3.5
```

---

> **Next Step**: Begin Phase 1, Epic 1.1 — Project Scaffolding
