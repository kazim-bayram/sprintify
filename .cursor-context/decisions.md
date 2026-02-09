# Sprintify - Architectural Decision Records (ADR)

> **Purpose**: Immutable log of every significant architectural and technical decision. Once a decision is recorded, it is NEVER deleted — only superseded by a new decision that references the old one.
>
> **Instructions**: Use the template below for each decision. Decisions should be recorded as soon as they are made, not retroactively. Include the reasoning — future-you will thank present-you.

---

## Decision Log Index

| ID | Title | Date | Status |
|----|-------|------|--------|
| ADR-001 | Project Documentation Structure | 2026-02-09 | Accepted |
| ADR-002 | Tech Stack Selection | 2026-02-09 | Accepted |
| ADR-003 | Database & Data Model Strategy | 2026-02-09 | Accepted |
| ADR-004 | Multi-Tenancy Model | 2026-02-09 | Accepted |
| ADR-005 | Authentication Strategy | 2026-02-09 | Accepted |
| ADR-006 | State Management & Real-Time Strategy | 2026-02-09 | Accepted |
| ADR-007 | RBAC & Permissions Model | 2026-02-09 | Accepted |
| ADR-008 | Sprint & Agile Engine Design | 2026-02-09 | Accepted |
| ADR-009 | Deployment & Infrastructure | 2026-02-09 | Accepted |
| ADR-010 | API Strategy | 2026-02-09 | Accepted |
| ADR-011 | File Storage Strategy | 2026-02-09 | Accepted |

---

## ADR-001: Project Documentation Structure

- **Decision ID**: ADR-001
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Starting a new project (Sprintify) with no existing codebase or documentation. Need a structured way to track discovery, research, planning, progress, and architectural decisions throughout the project lifecycle. The AI agent assisting development needs a persistent "memory" across sessions.

### Decision
Create a `.cursor-context/` directory in the project root containing 6 structured markdown files:
1. `discovery.md` — Scope definition Q&A
2. `research.md` — Domain research tracker
3. `plan.md` — Master execution plan (Phases > Epics > Tasks)
4. `progress.md` — Status tracker with checkboxes
5. `decisions.md` — Architectural Decision Records (this file)
6. `context.md` — Agent active memory / session context

### Alternatives Considered
1. **Single PLANNING.md file**: Rejected — becomes unwieldy as the project grows.
2. **GitHub Issues / Project Board only**: Rejected — not agent-friendly, not co-located with code.
3. **Wiki (Notion/Confluence)**: Rejected — external dependency, breaks single-repo principle.
4. **Root-level files**: Considered — opted for `.cursor-context/` to keep root clean.

### Consequences
- **Positive**: Clear separation of concerns, version-controlled with codebase, agent-navigable.
- **Negative**: Requires discipline to keep files updated.
- **Mitigation**: `context.md` includes instructions for the agent to actively maintain these files.

---

## ADR-002: Tech Stack Selection

- **Decision ID**: ADR-002
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Need a full-stack framework for a solo/small-team SaaS PM tool. Must support SSR for SEO (marketing pages), real-time UI for boards, and tight DB integration. Product owner is a solo dev who values velocity over architectural purity. Target: deploy to Vercel with minimal DevOps overhead.

### Decision
**Next.js (App Router)** as the full-stack modular monolith.
- **Frontend**: React 19 + Next.js App Router (RSC + Server Actions)
- **Styling**: Tailwind CSS (utility-first, fast iteration)
- **UI Components**: shadcn/ui (copy-paste, no dependency lock-in)
- **State Management**: Zustand (lightweight, optimistic UI friendly) or React Query / TanStack Query for server state
- **Drag & Drop**: @dnd-kit (accessible, performant, React-native compatible)
- **API Layer**: tRPC or Next.js Server Actions (internal only, no public API yet)

### Alternatives Considered
1. **Remix**: Excellent DX but smaller ecosystem. Vercel-native deployment is better with Next.js.
2. **SPA (Vite + React)**: No SSR, hurts marketing pages and initial load. Also separates frontend/backend into two deployments.
3. **SvelteKit**: Smaller hiring pool, less ecosystem maturity for complex UIs.
4. **T3 Stack (Next + tRPC + Prisma + Tailwind)**: Very close to our choice. We'll adopt this pattern but not the rigid T3 template.

### Consequences
- **Positive**: Single deployment target (Vercel), full-stack in one repo, huge ecosystem, Server Components for performance.
- **Negative**: Next.js App Router is still maturing (caching quirks, Server Action limitations). Vendor-adjacent to Vercel.
- **Mitigation**: Keep business logic in plain TypeScript modules decoupled from Next.js specifics. If we need to eject, the domain layer is portable.

---

## ADR-003: Database & Data Model Strategy

- **Decision ID**: ADR-003
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Tickets have mostly structured data (title, status, assignee, sprint) but need flexibility for custom fields (labels, priority, t-shirt sizing). Need strong relational integrity for reporting (burndown charts, velocity). Must support Row-Level Security for multi-tenancy.

### Decision
**PostgreSQL** (via Supabase or Neon) with a hybrid approach:
- **Core entities** (users, orgs, projects, sprints, tickets): Fully relational with proper foreign keys, indexes, and constraints.
- **Flexible attributes**: JSONB column (`ticket_metadata`) on the tickets table for labels, priority, t-shirt size, and future semi-custom fields.
- **ORM**: Prisma (type-safe, migration-friendly, excellent DX).
- **Audit**: Activity stream table logging status changes and comments only. No full event sourcing in MVP.

### Alternatives Considered
1. **MongoDB**: Flexible schema but terrible for relational queries needed in reporting. No RLS. Rejected.
2. **PlanetScale (MySQL)**: No native JSONB, no RLS. Rejected.
3. **Full EAV (Entity-Attribute-Value)**: Maximum flexibility but query performance nightmare. Rejected for MVP.
4. **Drizzle ORM**: Lighter than Prisma but less mature migration tooling. Reconsidered for later.

### Consequences
- **Positive**: Relational integrity for reporting, JSONB flexibility without schema migrations for every field change, Prisma DX is excellent.
- **Negative**: JSONB columns can't be indexed as efficiently as native columns. Prisma has some edge cases with raw SQL.
- **Mitigation**: Keep JSONB usage restricted to semi-structured metadata. If a JSONB field becomes heavily queried, promote it to a native column.

---

## ADR-004: Multi-Tenancy Model

- **Decision ID**: ADR-004
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Sprintify is SaaS serving multiple organizations. Need data isolation between tenants without operational complexity of managing multiple databases as a solo dev.

### Decision
**Multi-tenant shared database with Row-Level Security (RLS).**
- Every table with tenant-scoped data includes an `organization_id` column.
- PostgreSQL RLS policies enforce isolation at the database level.
- Application-level middleware also filters by `organization_id` as defense-in-depth.
- Supabase provides RLS out of the box if we use Supabase as the Postgres host.

### Alternatives Considered
1. **Schema-per-tenant**: Better isolation but migration complexity grows linearly with tenant count. Rejected.
2. **DB-per-tenant**: Best isolation but operational suicide for a solo dev. Rejected.
3. **Application-level filtering only (no RLS)**: One bad query leaks data across tenants. Rejected — RLS is the safety net.

### Consequences
- **Positive**: Single database to manage, simple deployments, RLS provides database-level security guarantee.
- **Negative**: Noisy-neighbor risk (one tenant's heavy queries affect others). Harder to do per-tenant backups.
- **Mitigation**: Connection pooling (PgBouncer/Supabase), query performance monitoring, and rate limiting at the application level.

---

## ADR-005: Authentication Strategy

- **Decision ID**: ADR-005
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Need authentication that supports OAuth (GitHub, Google), magic links, and potentially SSO/SAML for enterprise tier later. Must never roll our own crypto. Must integrate cleanly with Next.js and PostgreSQL.

### Decision
**Supabase Auth** (primary choice) or **Clerk** (fallback).
- Social providers: GitHub (primary), Google.
- Email/password with magic link support.
- Session management handled by the provider.
- User records synced to our `users` table via webhook/trigger for application-level queries.

### Alternatives Considered
1. **NextAuth (Auth.js)**: Open source, flexible, but requires self-managing session storage and has had breaking changes across versions. More maintenance burden.
2. **Auth0**: Enterprise-grade but expensive at scale. Overkill for MVP.
3. **Roll our own (JWT + bcrypt)**: Explicitly rejected. "Never roll our own crypto."
4. **Clerk**: Excellent DX, beautiful prebuilt components. Slightly more expensive than Supabase Auth. Strong fallback option.

### Consequences
- **Positive**: Zero auth code to maintain, battle-tested security, prebuilt UI components, SSO/SAML upgrade path for enterprise tier.
- **Negative**: Vendor lock-in to Supabase/Clerk. If we change providers, auth migration is painful.
- **Mitigation**: Abstract auth behind an interface layer. The app references `getCurrentUser()` not `supabase.auth.getUser()` directly.

---

## ADR-006: State Management & Real-Time Strategy

- **Decision ID**: ADR-006
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
The core UX promise is "the app must feel instant." Dragging a card must update in <16ms (60fps). Multiple users viewing the same board should see live updates. However, full collaborative editing (Google Docs-style) is out of scope for MVP.

### Decision
- **Optimistic UI**: All user actions (drag, status change, edit) update the local state immediately. Server confirmation happens async. On failure, rollback + toast notification.
- **Real-Time**: Supabase Realtime (WebSocket) for board-level state syncing. When User A moves a card, User B sees it move live.
- **Conflict Resolution**: Last-Write-Wins (LWW) with visual soft-locking ("User A is editing...").
- **Offline**: Not supported in MVP. App goes read-only if offline, with a clear UI warning.
- **Client State**: Zustand or TanStack Query for managing optimistic updates and server cache.

### Alternatives Considered
1. **CRDTs (Yjs/Automerge)**: Too complex for MVP. Designed for character-level collaborative editing, not board state.
2. **Server-Sent Events (SSE)**: Simpler than WebSocket but unidirectional. WebSocket is needed for bidirectional board sync.
3. **Polling (30s interval)**: Cheap but terrible UX for a "real-time feeling" board. Rejected.
4. **Full offline-first (IndexedDB + sync)**: Massive complexity. Linear took years to build this. Explicitly deferred.

### Consequences
- **Positive**: App feels instant. Real-time collaboration on boards. Simple conflict model.
- **Negative**: LWW can cause silent data overwrites if two users edit the same field simultaneously. No offline capability.
- **Mitigation**: Soft-locking UI warns when another user is editing. Field-level LWW (not document-level) minimizes data loss surface.

---

## ADR-007: RBAC & Permissions Model

- **Decision ID**: ADR-007
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Need access control for organizations with multiple projects. Must support external stakeholders viewing boards without accounts. Must be simple enough for MVP but extensible for granular permissions later.

### Decision
**3-role RBAC** at the organization level:
- **Admin**: Full access — manage users, billing, delete projects, all CRUD.
- **Member**: Create/edit tickets, move cards, comment. Cannot manage org settings or delete projects.
- **Viewer**: Read-only access. Intended for stakeholders/clients.

**Additional**:
- Organization-scoped projects: Admins see all projects, Members see only invited projects.
- **Public share links**: Admins can generate a read-only `sprintify.app/share/{token}` URL for any board. No login required.

### Alternatives Considered
1. **Granular permission system (ABAC)**: "Can edit tickets but not delete sprints" — too complex for MVP. Can be layered on later.
2. **Project-level roles**: Different roles per project (Admin on Project A, Viewer on Project B). Adds complexity. Deferred.
3. **Casbin/CASL policy engine**: Overkill for 3 roles. Simple middleware checks suffice.

### Consequences
- **Positive**: Dead simple to implement and reason about. 3 roles cover 95% of MVP use cases. Share links are a killer feature for client-facing teams.
- **Negative**: No per-project role differentiation. A Member is a Member everywhere they're invited.
- **Mitigation**: Store roles in a `memberships` join table (user_id, org_id, role, project_id) so we can add project-level roles later without schema changes.

---

## ADR-008: Sprint & Agile Engine Design

- **Decision ID**: ADR-008
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
The "Agile Engine" is the differentiating feature. Must handle sprint lifecycle, velocity tracking, and board management. Product owner has strong opinions from real-world PM experience about what NOT to automate.

### Decision
- **Sprint Rollover**: Explicit user choice. On sprint close, a modal asks "Move incomplete tickets to [Next Sprint] or [Backlog]?" per ticket. No auto-rollover.
- **Velocity**: Story Points (Fibonacci: 1, 2, 3, 5, 8). Burndown chart (Total SP - Completed SP per day). Optional T-shirt sizing (S/M/L) mapped to points.
- **Kanban Board**: Semi-fixed columns: `Backlog → To Do → In Progress → Review → Done`. Renameable but not arbitrarily creatable in MVP.
- **Estimation**: Story points primary. T-shirt sizes as alias. No time-based estimation.

### Alternatives Considered
1. **Auto-rollover**: Hides bottlenecks. PM must consciously acknowledge incomplete work. Rejected on principle.
2. **Fully customizable boards**: Infinite columns, swimlanes, WIP limits — 5x complexity. Deferred to later phase.
3. **#NoEstimates**: Philosophically interesting but removes the data needed for burndown charts. Rejected for MVP.
4. **Time-based estimation**: Hours/days estimates are universally hated and gamed. Story points abstract this better.

### Consequences
- **Positive**: Opinionated design forces good agile practice. Burndown charts are simple to compute. Column structure simplifies "done" logic.
- **Negative**: Power users may want custom columns or complex workflows. Semi-fixed board limits flexibility.
- **Mitigation**: Column configuration stored in a `board_columns` table with `position` and `name` fields — rename is trivial, and adding "create custom column" later is a schema addition, not a rewrite.

---

## ADR-009: Deployment & Infrastructure

- **Decision ID**: ADR-009
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Solo developer building an MVP SaaS. Need minimal DevOps overhead, automatic scaling for small loads, and near-zero infrastructure management.

### Decision
- **Hosting**: Vercel (Next.js native, edge functions, automatic preview deployments).
- **Database**: Supabase (managed Postgres, built-in RLS, Realtime, Auth) OR Neon (serverless Postgres if we decouple auth).
- **File Storage**: S3-compatible (Cloudflare R2 preferred for zero egress costs, or Supabase Storage). 10MB per file limit.
- **No self-hosted support** in Phase 1.
- **CI/CD**: Vercel's built-in Git integration (push to main = deploy).

### Alternatives Considered
1. **AWS (ECS/Fargate)**: Full control but massive DevOps overhead. Rejected for solo dev.
2. **Railway/Fly.io**: Good alternatives but less Next.js-native than Vercel.
3. **Self-hosted option**: Explicitly deferred. "We cannot debug customer servers."

### Consequences
- **Positive**: Near-zero DevOps. Push-to-deploy. Automatic SSL, CDN, edge routing. Supabase bundles DB + Auth + Realtime + Storage.
- **Negative**: Vendor lock-in to Vercel + Supabase. Cost can grow unpredictably at scale.
- **Mitigation**: Keep business logic framework-agnostic. If cost becomes an issue, the modular monolith can be containerized and moved to Railway/Fly.io.

---

## ADR-010: API Strategy

- **Decision ID**: ADR-010
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Need an API layer between frontend and database. Not exposing a public API in MVP — focus is entirely on the product UI.

### Decision
**Internal API only** using Next.js Server Actions and/or tRPC.
- Server Actions for simple mutations (create ticket, update status).
- tRPC for complex queries needing type-safe RPC (board data fetching, sprint calculations).
- No public REST/GraphQL API. No API versioning, rate limiting, or documentation needed yet.

### Alternatives Considered
1. **Public REST API from day 1**: Requires versioning, rate limiting, auth tokens, documentation. Massive overhead for no immediate value. Rejected.
2. **GraphQL**: Powerful but adds complexity (schema definitions, resolvers, N+1 prevention). Overkill for internal-only use. Rejected for MVP.
3. **Server Actions only**: Simpler but limited for complex data fetching patterns. tRPC fills the gap.

### Consequences
- **Positive**: Maximum velocity. No API surface to maintain externally. Full type safety end-to-end with tRPC.
- **Negative**: No third-party developer ecosystem. GitHub integration (ADR-008) will need a webhook endpoint.
- **Mitigation**: When public API is needed (Phase 5), tRPC routers can be adapted to REST endpoints via trpc-openapi.

---

## ADR-011: File Storage Strategy

- **Decision ID**: ADR-011
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Tickets need file attachments (images, documents). Must be cost-effective, secure (no public URLs to private files), and simple to implement.

### Decision
**S3-compatible object storage** via presigned URLs.
- **Primary**: Cloudflare R2 (S3-compatible, zero egress costs) or Supabase Storage.
- **Upload flow**: Client requests presigned upload URL from server → uploads directly to storage → stores reference in DB.
- **Download flow**: Server generates presigned download URL with expiry → client fetches.
- **Limit**: 10MB per file. No image transformation or PDF rendering in MVP — download links only.

### Alternatives Considered
1. **Direct DB storage (BYTEA)**: Terrible for performance and DB size. Explicitly rejected.
2. **AWS S3**: Industry standard but egress costs add up. R2 is S3-compatible with zero egress.
3. **Image CDN (Cloudinary/imgix)**: Overkill for MVP. Just need upload/download.

### Consequences
- **Positive**: Cheap, scalable, secure (presigned URLs expire). No files in the database.
- **Negative**: No image previews or thumbnails in MVP. Files are download-only.
- **Mitigation**: Can add image transformation later via Cloudflare Images or a serverless function.

---

## ADR-012: Labels as Relational Model (Not JSONB)

- **Decision ID**: ADR-012
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
The original plan stored labels/tags in the Ticket's JSONB `metadata` column. However, we need org-scoped labels (shared across projects), color-coding, and the ability to filter tickets by label efficiently.

### Decision
Create a dedicated `Label` model (org-scoped, name + hex color) and a `TicketLabel` many-to-many join table. Priority was also promoted from JSONB to a top-level String column on Ticket for better queryability.

### Alternatives Considered
- **JSONB array of label strings**: Simpler but no shared label management, no colors, poor query performance for filtering.
- **EAV pattern**: Over-engineered for our limited customization needs.

### Consequences
- **Positive**: Proper label management UI, efficient filtering via joins, shared labels across projects, color customization.
- **Negative**: Extra join query for label data on tickets.
- **Mitigation**: Include labels in eager-loading (Prisma `include`) on all ticket queries.

---

## ADR-013: Ticket Detail as Sheet (Not Full Page)

- **Decision ID**: ADR-013
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Need to decide how to display ticket details: full page route, modal dialog, or slide-over sheet.

### Decision
Use a shadcn/ui Sheet (slide-over panel from the right) for ticket detail view. The board remains visible underneath, maintaining spatial context. Deep-link routing can be added later.

### Alternatives Considered
- **Full page route** (`/projects/[slug]/tickets/[id]`): Loses board context, requires navigation back.
- **Modal dialog**: Feels more intrusive, harder to scroll long content.

### Consequences
- **Positive**: Board stays visible. Quick open/close. Feels like Linear/Notion. Frictionless editing.
- **Negative**: Limited horizontal space (max-w-2xl). Complex ticket details may feel cramped.
- **Mitigation**: Can add a "full page" expand button later if needed.

---

## ADR-014: @dnd-kit for Drag-and-Drop + recharts for Charts

- **Decision ID**: ADR-014
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Phase 3 requires a Kanban board with drag-and-drop between and within columns, and burndown charts for sprint tracking.

### Decision
Use `@dnd-kit/core` + `@dnd-kit/sortable` for DnD. Use `recharts` for burndown line charts. Use `canvas-confetti` for gamification effects.

### Alternatives Considered
- **react-beautiful-dnd**: Deprecated by Atlassian. Not maintained.
- **react-dnd**: Lower-level, more boilerplate. @dnd-kit has better React 18+ support.
- **D3.js**: Overkill for simple line charts. recharts is simpler.
- **Chart.js**: Canvas-based, harder to style with Tailwind.

### Consequences
- **Positive**: @dnd-kit is lightweight, accessible, and fully composable. recharts integrates well with React and supports responsive containers. canvas-confetti is tiny (4KB).
- **Negative**: @dnd-kit requires manual collision detection setup.
- **Mitigation**: Using `closestCorners` strategy which works well for column-based layouts.

---

## ADR-015: Sprint Model Design (Explicit Rollover)

- **Decision ID**: ADR-015
- **Date**: 2026-02-09
- **Status**: Accepted

### Context
Need to model sprints with planning, active, and closed lifecycle states. Must enforce one active sprint per project and implement explicit per-ticket rollover as defined in discovery.

### Decision
Sprint model with `PLANNING`/`ACTIVE`/`CLOSED` enum status. `sprintId` as optional FK on Ticket. SprintSnapshot model for daily burndown data. Rollover is a two-step process: close sprint (records final snapshot), then per-ticket decisions (next sprint or backlog).

### Alternatives Considered
- **Automatic rollover**: Moves all incomplete tickets automatically. Rejected per discovery (users want explicit choice).
- **Sprint as date range only**: No status tracking. Less flexible.
- **Event-sourced sprints**: Overcomplicated for our needs.

### Consequences
- **Positive**: Clean lifecycle management. Explicit rollover forces ticket-by-ticket acknowledgment. SprintSnapshot enables accurate burndown without recalculating from event history.
- **Negative**: SprintSnapshot requires periodic recording (on sprint start, ticket status change, or daily cron).
- **Mitigation**: Snapshots are upserted (idempotent), and `recordSnapshot` mutation can be called on-demand.

---

<!-- TEMPLATE FOR NEW DECISIONS

## ADR-XXX: [Title]

- **Decision ID**: ADR-XXX
- **Date**: YYYY-MM-DD
- **Status**: Proposed | Accepted | Deprecated | Superseded by ADR-YYY

### Context
What is the problem or situation that requires a decision?

### Decision
What did we choose? Be specific.

### Alternatives Considered
What other options were evaluated? Why were they rejected?

### Consequences
- **Positive**: What benefits does this bring?
- **Negative**: What are the trade-offs or risks?
- **Mitigation**: How do we address the negatives?

-->
