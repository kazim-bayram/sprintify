Sprintify - Discovery & Scope Definition

    Purpose: Initial Q&A log to define scope, challenge assumptions, and eliminate ambiguity before a single line of code is written. Every unanswered question here is a risk.

    Instructions: Answer each question below. Be as specific as possible. "I don't know yet" is a valid answer — it gets flagged for research.

A. Product Identity & Business Model
Q1. Revenue Model & Monetization

Answer: Freemium Model.

    Free Tier: Free forever for small teams (up to 10 users/10 projects) to encourage adoption and "bottom-up" growth (like Linear/Slack).

    Paid Tier: High-ticket licensing for Enterprise features (SSO, Audit Logs, Advanced Reporting) later on.

    Rationale: We need user feedback first. Revenue comes after product-market fit.

Q2. Target User Scale (Day 1 vs. Year 1)

Answer:

    Day 1 (MVP): Strict cap. Max 10 teams, max 10 users per team.

    Focus: Performance and UX perfection for a small group rather than scaling a buggy app to thousands.

Q3. Competitive Positioning

Answer: "Frictionless Flow & Gamified Velocity."

    Problem: Jira is slow and feels like data entry work (Eti experience: people hate logging time/status because the UI fights them).

    Solution: Sprintify will be keyboard-first (Cmd+K menus), visually dopamine-friendly (like Balatro animations for completed tasks), and faster than a spreadsheet.

    Unique Value: It makes project management feel like a strategy game, not a bureaucratic obligation.

B. Architecture & Tenancy
Q4. Multi-Tenancy Strategy

Answer: Multi-tenant with Row-Level Security (RLS).

    Architecture: Shared Postgres Database.

    Isolation: Every query filters by organization_id.

    Rationale: Easiest to maintain for a solo dev. Creating a DB per tenant is operational suicide for an MVP.

Q5. Deployment Model

Answer: Cloud-Hosted SaaS (Vercel + Supabase/Neon).

    Constraint: No self-hosted support in Phase 1. We cannot debug customer servers.

Q6. Monolith vs. Microservices (Day 1)

Answer: Modular Monolith.

    Stack: Next.js (Full stack).

    Rationale: Premature microservices are the #1 killer of velocity. We keep everything in one repo (functions, UI, DB logic) until strictly necessary to split.

C. State Management & Real-Time
Q7. Optimistic UI vs. Server Truth

Answer: Aggressive Optimistic UI.

    Behavior: When a user drags a card, it moves instantly. If the server fails 200ms later, we roll back and show a toaster error.

    Rationale: Perceived performance is everything. The app must feel "local".

Q8. Real-Time Collaboration Depth

Answer: (b) WebSocket Push (Supabase Realtime).

    Scope: Board columns and ticket statuses update live without refreshing.

    Constraint: We will NOT do Google Docs style collaborative text editing inside the description for MVP (too complex). We will handle "Board State" syncing only.

Q9. Conflict Resolution Policy

Answer: Last-Write-Wins (LWW) + Visual Locking.

    Logic: If User A and User B edit the title, the last request saved is the truth.

    UX: If User A is editing a ticket, User B sees "User A is editing..." (Soft lock).

Q10. Offline Support

Answer: Online-First with Graceful Degradation.

    We will NOT build a full offline sync engine (like Linear's IDB sync) in Phase 1. It creates massive complexity with conflict resolution.

    Behavior: If offline, the app goes "Read Only" or blocks actions with a specific UI warning.

D. Data Model & Storage
Q11. Relational (SQL) vs. Document (NoSQL)

Answer: Hybrid (Postgres).

    Core: Relational SQL for Users, Orgs, Projects, Sprints (Enforces structure).

    Flexibility: JSONB column for ticket_attributes to allow for custom fields without schema migrations every time.

    Eti Lesson: Structured data is essential for the reporting modules we will build later.

Q12. Custom Fields on Tickets

Answer: Restricted Dynamic Fields.

    Users can add "Labels", "Priority", and "T-Shirt Size".

    We will not allow fully custom typed fields (like Date/Regex formulas) in MVP to protect the DB performance.

Q13. Audit Trail & History

Answer: "Activity Stream" only.

    We will log "Status Changes" and "Comments".

    We will NOT log "User changed title from X to Y" diffs in MVP.

Q14. File Attachments Strategy

Answer: S3 Compatible Storage (AWS S3 or R2) via Presigned URLs.

    Strict limit: 10MB per file.

    No direct DB storage.

E. The Agile Engine (Sprint Logic)
Q15. Sprint Rollover Logic

Answer: (c) Explicit User Choice.

    Eti Lesson: Auto-moving tasks hides bottlenecks.

    Flow: When closing a Sprint, a modal asks: "You have 3 incomplete tasks. Move to [Next Sprint] or [Backlog]?"

    This forces the PM to acknowledge the delay.

Q16. Sprint Velocity & Metrics

Answer: Burndown Chart (MVP).

    Simple calculation: Total Story Points - Completed Points per day.

    No complex predictive analytics yet.

Q17. Board Flexibility

Answer: Semi-Fixed Kanban.

    Columns: Backlog -> To Do -> In Progress -> Review -> Done.

    Users can rename them, but cannot create infinite arbitrary columns in MVP (complicates the "Done" logic).

Q18. Estimation Model

Answer: Story Points (Fibonacci: 1, 2, 3, 5, 8).

    It abstracts "Time" effectively.

    Optional: "T-Shirt Sizing" (S, M, L) mapped to points behind the scenes.

F. Permissions & Access Control
Q19. RBAC Granularity

Answer: Role-Based (3 Roles).

    Admin: Can delete project, manage users, billing.

    Member: Can create/edit tickets, move cards.

    Viewer: Read-only (Stakeholders/Clients).

    Simple and rigid for MVP.

Q20. Cross-Project Visibility

Answer: Organization Scoped.

    An "Admin" sees all projects in the Org.

    A "Member" sees only projects they are invited to.

Q21. External Stakeholder Access

Answer: Public Share Links (Read-Only).

    Admins can generate a sprintify.app/share/xyz link for a specific board.

    No login required for the viewer. Great for showing progress to clients without onboarding them.

G. Integrations & Ecosystem
Q22. Authentication Strategy

Answer: Supabase Auth / Clerk.

    Social Providers: GitHub (Primary), Google.

    Email/Password magic links.

    Decision: Never roll our own crypto.

Q23. Third-Party Integrations (Day 1)

Answer: GitHub Integration.

    Feature: Detecting Fixes #123 in commit messages to auto-move tickets to "Review".

    This is the single most critical integration for developer adoption.

Q24. API-First Design

Answer: Internal API (Server Actions/tRPC).

    We are NOT documenting a public API yet. Focus on the product UI.

H. Non-Functional & Operational
Q25. Performance Budget & Reliability Targets

Answer:

    Latency: Board load < 500ms. Interaction (Drag/Drop) < 16ms (60fps).

    Uptime: Best effort (dependent on Vercel/Supabase tiers).

    Key Constraint: The app must feel "Instant". No spinners on small interactions.

Summary
Category	Questions	Answered	Pending
Product Identity	Q1-Q3	3	0
Architecture & Tenancy	Q4-Q6	3	0
State & Real-Time	Q7-Q10	4	0
Data Model & Storage	Q11-Q14	4	0
Agile Engine	Q15-Q18	4	0
Permissions & Access	Q19-Q21	3	0
Integrations	Q22-Q24	3	0
Non-Functional	Q25	1	0
Total	25	25	0

    Status: Discovery COMPLETE (2026-02-09). All answers synthesized into 11 ADRs in decisions.md. plan.md populated with concrete tasks. Ready for Phase 1.