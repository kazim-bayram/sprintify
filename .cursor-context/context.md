# Sprintify NPD — Agent Active Memory

> **ALWAYS read this file first.** Updated after every major change.

---

## Current Status

**Platform:** FMCG New Product Development (NPD) Agile Platform  
**Architecture:** Hybrid Agile (Stage-Gate + Scrum)  
**Phase:** NPD Pivot COMPLETE → Ready for next iteration  
**Build:** ✅ Passes (15 routes, 0 errors)

---

## Tech Stack (Locked)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5.x |
| Database | PostgreSQL (Supabase/Neon) | — |
| ORM | Prisma | 7.3.0 |
| Auth | Supabase Auth (SSR) | — |
| API | tRPC v11 | 11.x |
| Styling | Tailwind CSS v4 + shadcn/ui | — |
| DnD | @dnd-kit/core + sortable | — |
| Charts | recharts | — |
| Gamification | canvas-confetti | — |
| Hosting | Vercel | — |

---

## Domain Hierarchy

```
Organization (Multi-tenant)
  └── Program (Brand/Category — e.g., "Healthy Snacks")
       └── Project (Epic — e.g., "Protein Bar Launch")
            ├── Feature (Stage — e.g., "Formula Dev", "Lab Testing")
            ├── BoardColumn (Backlog → To Do → In Progress → Evaluation/Lab → Done)
            ├── Sprint (Planning → Active → Closed)
            └── UserStory (Core work unit — was "Ticket")
                 ├── Task (Granular actions)
                 ├── ChecklistItem (DoR + DoD quality gates)
                 ├── Comment
                 ├── Activity
                 ├── Attachment
                 └── StoryLabel
```

---

## Key Domain Concepts

- **Department enum:** MARKETING, R_AND_D, PACKAGING, QUALITY, SUPPLY_CHAIN, FINANCE
- **WSJF Scoring:** (UserBusinessValue + TimeCriticality + RiskReduction) / JobSize
- **Quality Gates:** DoR (Definition of Ready) + DoD (Definition of Done)
- **DoD blocks Done column:** Stories cannot be dragged to "Done" if DoD items are unchecked
- **Default columns:** Backlog → To Do → In Progress → Evaluation/Lab → Done
- **Story Points:** Fibonacci (1, 2, 3, 5, 8, 13)
- **Value Tracking:** SprintSnapshot tracks both points AND business value delivered

---

## tRPC Routers (12 total)

| Router | Purpose |
|--------|---------|
| `project` | CRUD + board columns |
| `story` | CRUD + move + archive (was `ticket`) |
| `program` | Brand/category management |
| `feature` | Stage management per project |
| `task` | Granular tasks within stories |
| `checklist` | DoR/DoD quality gates |
| `comment` | Story comments |
| `label` | Org-scoped labels |
| `member` | Org member management |
| `search` | Global search (stories + projects) |
| `sprint` | Sprint lifecycle + rollover + snapshots |
| `organization` | Org CRUD |

---

## Optimistic DnD Architecture

1. Local `columnsState` tracks board visually
2. `handleDragOver` → instant cross-column move (no server call)
3. `handleDragEnd` → fires `story.move` mutation in background
4. On error → reverts `columnsState` to server state + toast error
5. Quality gate: `story.move` checks DoD before allowing "Done" column

---

## Important Constraints

- **NOT for software developers.** Target users: R&D, Marketing, Packaging, Quality teams.
- **No dev jargon:** No "bug", "refactor", "commit", "CI/CD" in UI.
- **FMCG terminology:** Formula, Prototype, Shelf Life Test, Regulatory Check, Launch.
- **Renamed:** `Ticket` → `UserStory`, `tickets` table → `user_stories` table

---

## Session Log

| Date | Action |
|------|--------|
| 2026-02-09 | NPD Pivot: Complete 4-phase refactoring |
| — | Schema: Added Program, Feature, Task, ChecklistItem, Department enum, WSJF fields |
| — | Renamed Ticket → UserStory throughout codebase |
| — | New tRPC routers: program, feature, task, checklist |
| — | Optimistic DnD with instant UI + error revert + quality gate enforcement |
| — | Card redesign: WSJF badge, department color tags, DoD progress, feature tag |
| — | Value-delivered tracking in SprintSnapshot + Sprint History |
| — | Updated all components, seed file, and documentation |
