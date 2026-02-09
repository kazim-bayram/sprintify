# Sprintify

Open-source, keyboard-first, gamified Agile project management tool. Faster than a spreadsheet, more fun than Jira.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| Auth | Supabase Auth (GitHub, Google, Magic Links) |
| API | tRPC v11 (internal) |
| Real-Time | Supabase Realtime |
| Hosting | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)

### Setup
```

2. **Configure environment variables:**

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase Dashboard → Settings → API
- `DATABASE_URL` — from Supabase Dashboard → Settings → Database
- `DIRECT_URL` — same as DATABASE_URL (for migrations)

Also update the `DATABASE_URL` in `.env` (used by Prisma CLI).

3. **Set up the database:**

```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed with demo data (optional)
```

4. **Configure Supabase Auth:**

In your Supabase Dashboard → Authentication → Providers:
- Enable GitHub OAuth (add Client ID + Secret)
- Enable Google OAuth (add Client ID + Secret)
- Set Site URL to `http://localhost:3000`
- Add `http://localhost:3000/auth/callback` to Redirect URLs

5. **Start development:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Sign-in, sign-up pages
│   ├── (dashboard)/        # Authenticated routes (sidebar layout)
│   │   ├── projects/       # Projects list + board view
│   │   ├── dashboard/      # Overview (Phase 3)
│   │   └── settings/       # Settings (Phase 2)
│   ├── api/trpc/           # tRPC API route handler
│   ├── auth/callback/      # Supabase OAuth callback
│   └── onboarding/         # First-time org creation
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Sidebar, topbar
│   ├── board/              # Kanban board components
│   ├── projects/           # Project list, create dialog
│   ├── tickets/            # Ticket card, create dialog
│   └── providers/          # tRPC, query providers
├── lib/
│   ├── supabase/           # Supabase client (browser, server, middleware)
│   ├── constants.ts        # App constants, enums
│   └── utils.ts            # Utility functions
├── server/
│   ├── auth/               # Auth helpers (getCurrentUser, requireUser)
│   ├── db.ts               # Prisma client singleton
│   └── trpc/               # tRPC routers and initialization
│       ├── init.ts         # Context, procedures, middleware
│       ├── router.ts       # Root router
│       └── routers/        # Feature routers (project, ticket, org)
└── trpc/
    ├── client.ts           # Client-side tRPC hooks
    ├── server.ts           # Server-side tRPC caller
    └── query-client.ts     # TanStack Query config
```

## Architecture Decisions

All architectural decisions are documented in `.cursor-context/decisions.md`.

## License

MIT
