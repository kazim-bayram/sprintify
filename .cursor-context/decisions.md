# Sprintify NPD — Architectural Decision Records

---

## ADR-016: NPD Domain Pivot (Ticket → UserStory, FMCG Hierarchy)

**Date:** 2026-02-09  
**Context:** Sprintify was a generic software PM tool. The product needs to serve FMCG R&D, Marketing, Packaging, and Quality teams doing New Product Development using Hybrid Agile (Stage-Gate + Scrum).

**Decision:**
- Renamed `Ticket` model to `UserStory` (table: `user_stories`)
- Added hierarchy: Organization → Program → Project → Feature → UserStory → Task
- Added `Department` enum: MARKETING, R_AND_D, PACKAGING, QUALITY, SUPPLY_CHAIN, FINANCE
- Added WSJF scoring fields: userBusinessValue, timeCriticality, riskReduction, jobSize
- Added `ChecklistItem` model with DoR/DoD quality gate types
- Default board columns: Backlog → To Do → In Progress → Evaluation/Lab → Done
- All UI strings changed from developer jargon to FMCG/NPD terminology

**Alternatives Rejected:**
- Keeping generic PM model and layering FMCG as config → Too much abstraction, poor DX for domain experts
- Separate FMCG module → Over-engineering for a single product pivot

**Consequences:**
- Database migration required (new tables, renamed tables)
- All tRPC routers rewritten for new schema
- Old `tickets` table no longer exists
- UI fully domain-specific for FMCG teams

---

## ADR-017: WSJF as Primary Prioritization Metric

**Date:** 2026-02-09  
**Context:** FMCG teams use Weighted Shortest Job First from their Excel workflow to decide which work items deliver the most value fastest.

**Decision:**
- WSJF = (User/Business Value + Time Criticality + Risk Reduction) / Job Size
- All 4 inputs stored as integer fields on `UserStory` (0-10 for value/criticality/risk, Fibonacci for job size)
- WSJF score computed client-side via `calculateWSJF()` utility
- Score displayed prominently on story cards and in detail sheets
- Backlog sorted by WSJF descending by default

**Alternatives Rejected:**
- Store WSJF as computed column → Prisma doesn't support computed columns natively, and client-side computation is fast
- MoSCoW prioritization → Less granular, doesn't factor in effort

**Consequences:**
- Every story card shows the WSJF badge
- WSJF breakdown editable in story detail sidebar
- Create story dialog includes full WSJF input section

---

## ADR-018: Quality Gates (DoR/DoD) with Column Blocking

**Date:** 2026-02-09  
**Context:** Physical product development requires strict quality gates. A formula can't be "done" without lab results. A packaging design can't ship without regulatory approval.

**Decision:**
- `ChecklistItem` model with type `DOR` (Definition of Ready) or `DOD` (Definition of Done)
- DoD blocking: `story.move` tRPC mutation checks if all DoD items are checked before allowing move to "Done" column
- If DoD incomplete → throws `PRECONDITION_FAILED` error → optimistic UI reverts → toast shows how many items remain
- Visual indicator on story cards shows DoD progress (e.g., "2/3")

**Alternatives Rejected:**
- Soft warning only → Defeats the purpose of quality gates in regulated product development
- Column-level gates → Too rigid; gates should be per-story since different stories have different requirements

**Consequences:**
- Teams must define DoD items before closing stories
- Enforced at server level, not just UI
- Adds ~100ms latency to "Done" moves for the DoD check

---

## ADR-019: Optimistic DnD with Server-Side Revert

**Date:** 2026-02-09  
**Context:** The board must feel instant (<50ms) when dragging cards. Previous implementation waited for server response.

**Decision:**
- Local `columnsState` in React state for instant visual feedback
- `handleDragOver` moves cards between columns with zero network calls
- `handleDragEnd` fires background `story.move` mutation
- On success → `router.refresh()` syncs server state
- On error (e.g., DoD gate) → reverts `columnsState` to `project.boardColumns` + shows toast

**Alternatives Rejected:**
- TanStack Query `onMutate` optimistic update → More complex cache management; local state is simpler for DnD
- Debounced server sync → Risky for data consistency in multi-user scenarios

**Consequences:**
- UI feels instant regardless of network latency
- Server remains source of truth
- Quality gate rejections show clear error messaging

---

*(Previous ADRs 001-015 archived — see git history)*
