# Sprintify - Research Log

> **Purpose**: Domain-specific research assignments for sub-agents. Findings feed directly into `decisions.md`.
>
> **Last Updated**: 2026-02-09

---

## Research Queue

| # | Topic | Specific Question | Status | Findings Summary | Source / Link |
|---|-------|-------------------|--------|------------------|---------------|
| R-001 | Supabase Realtime | What are the connection limits, message throughput, and latency characteristics of Supabase Realtime for live Kanban board updates? | `TODO` | — | — |
| R-002 | Supabase RLS Patterns | Best practices for RLS policies with Prisma ORM. Does Prisma bypass RLS? How to ensure all queries respect RLS? | `TODO` | — | — |
| R-003 | JSONB Custom Fields | Performance benchmarks for JSONB queries with GIN indexes in PostgreSQL. At what data volume do JSONB queries degrade? | `TODO` | — | — |
| R-004 | @dnd-kit Performance | How does @dnd-kit perform with 100+ cards on a Kanban board? Any known performance issues or virtualization needs? | `TODO` | — | — |
| R-005 | Optimistic UI Patterns | Best practices for optimistic updates with TanStack Query + tRPC. Rollback strategies on server error. | `TODO` | — | — |
| R-006 | Sprint Velocity Math | Standard formula for sprint velocity. How do tools handle incomplete stories, split stories, and scope changes mid-sprint? | `TODO` | — | — |
| R-007 | Supabase Auth vs Clerk | Cost comparison at 10k MAU. Feature parity (magic links, SSO roadmap, React components). Migration difficulty. | `TODO` | — | — |
| R-008 | Open Source PM Tools | Analyze architecture of Plane (plane.so) and Focalboard. Schema design, tech stack, what we can learn. | `TODO` | — | — |
| R-009 | Prisma + Supabase Setup | Correct configuration for Prisma with Supabase (connection pooling via PgBouncer, direct vs pooled URLs). | `TODO` | — | — |
| R-010 | shadcn/ui + Kanban | Existing shadcn/ui patterns for Kanban boards. Any community components or do we build from scratch with @dnd-kit? | `TODO` | — | — |
| R-011 | Presigned URL Flow | Implementation pattern for R2/S3 presigned uploads in Next.js Server Actions. Security considerations. | `TODO` | — | — |
| R-012 | Ticket Ordering | Lexicographic ranking (LexoRank) vs integer position for card ordering in drag-and-drop. Trade-offs for reordering. | `TODO` | — | — |
| R-013 | GitHub Webhook Integration | How to securely receive GitHub push webhooks in Next.js API routes. Parsing commit messages for `Fixes #TICKET-ID`. | `BLOCKED` | Deferred to Phase 4 | — |
| R-014 | Notification Architecture | ~~Compare polling, WebSocket push, email digest for notifications.~~ | `CANCELLED` | Deferred — not in MVP scope (Phase 4). | — |
| R-015 | CRDT vs OT | ~~For collaborative ticket editing, are CRDTs practical?~~ | `CANCELLED` | Decision made: No collaborative text editing in MVP (ADR-006). LWW + soft-lock instead. | — |

---

## Priority Order for Phase 1

> Research items to complete BEFORE or DURING Phase 1 scaffolding:

1. **R-009**: Prisma + Supabase setup (blocks Epic 1.2)
2. **R-002**: Supabase RLS patterns (blocks Epic 1.2)
3. **R-007**: Supabase Auth vs Clerk (blocks Epic 1.3)
4. **R-001**: Supabase Realtime limits (informs Epic 3.6 design)
5. **R-005**: Optimistic UI patterns (informs Epic 1.4 + 3.1)

---

## Status Legend

| Status | Meaning |
|--------|---------|
| `TODO` | Not yet started |
| `IN_PROGRESS` | Research underway |
| `DONE` | Findings documented |
| `BLOCKED` | Waiting on a future phase |
| `CANCELLED` | No longer relevant (decision made) |
