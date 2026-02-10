import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";
import {
  Zap, ArrowRight, Check, GanttChart, Kanban, BarChart3, Users, ShieldCheck,
  Layers, Target, Rocket, Building2, FlaskConical, Code2, Megaphone,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <div className="min-h-screen bg-background">
      {/* =================== NAVBAR =================== */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Features</a>
            <a href="#use-cases" className="text-muted-foreground transition-colors hover:text-foreground">Use Cases</a>
            <a href="#pricing" className="text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
                >
                  Log In
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start for Free <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =================== HERO =================== */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center sm:py-32 lg:py-40">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-xs font-medium">
            <Layers className="h-3 w-3 text-primary" />
            Agile + Waterfall + Hybrid &mdash; One Platform
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Agile for Teams.{" "}
            <span className="bg-linear-to-r from-primary via-violet-500 to-blue-500 bg-clip-text text-transparent">
              Waterfall for Managers.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Bring your Engineering, Marketing, and Leadership teams onto one platform.
            Seamlessly switch between Scrum Boards and Gantt Charts &mdash;
            or combine them with our Hybrid methodology.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={isLoggedIn ? "/projects" : "/sign-up"}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start for Free"} <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border px-8 py-3.5 text-base font-medium transition-colors hover:bg-muted"
            >
              Live Demo
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Real-time collaboration</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Works for any industry</span>
          </div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.08),transparent)]" />
      </section>

      {/* =================== THE HYBRID PROBLEM =================== */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The Problem with Picking Sides
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Your teams need speed. Your managers need visibility.
              Why force everyone onto one methodology when you can have both?
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-3 text-2xl">&#128465;</div>
              <h3 className="font-semibold text-lg">Jira</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Too complex for executives. Endless configuration. No native Gantt charts.
                Engineers love it &mdash; everyone else drowns.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-6">
              <div className="mb-3 text-2xl">&#128337;</div>
              <h3 className="font-semibold text-lg">MS Project</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Powerful Gantt charts, but no Agile. No real-time collaboration.
                Teams get slowed down by rigid waterfall plans.
              </p>
            </div>
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-6">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-lg text-primary">{APP_NAME}</h3>
              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                Scrum Boards + Gantt Charts + Hybrid mode.
                Teams move fast. Managers see the big picture. Everyone wins.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =================== FEATURE GRID =================== */}
      <section id="features" className="border-t py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to ship projects
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete toolkit for modern project teams &mdash; from sprint planning to executive reporting.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: GanttChart,
                title: "Interactive Gantt Charts",
                description: "Drag-and-drop phase planning with dependency arrows. Resize bars, link phases, and track progress on a visual timeline.",
                color: "text-indigo-600 bg-indigo-500/10",
              },
              {
                icon: Kanban,
                title: "Advanced Scrum Boards",
                description: "Fully configurable Kanban boards with WIP limits, custom columns, and optimistic drag & drop for instant updates.",
                color: "text-blue-600 bg-blue-500/10",
              },
              {
                icon: Target,
                title: "WSJF Prioritization",
                description: "Weighted Shortest Job First scoring. Calculate Cost of Delay / Job Size to prioritize by true business impact, not gut feeling.",
                color: "text-amber-600 bg-amber-500/10",
              },
              {
                icon: BarChart3,
                title: "Planning Poker",
                description: "Real-time estimation sessions with guest access. Vote on effort, value, time criticality, and risk — no login required for guests.",
                color: "text-violet-600 bg-violet-500/10",
              },
              {
                icon: ShieldCheck,
                title: "Quality Gates (DoR / DoD)",
                description: "Define criteria that must be met before work starts or finishes. Cards can't be moved to Done until all checks pass.",
                color: "text-red-500 bg-red-500/10",
              },
              {
                icon: Layers,
                title: "Hybrid Methodology",
                description: "Run Waterfall phases containing Agile sprints. The best of both worlds for complex, multi-team projects.",
                color: "text-green-600 bg-green-500/10",
              },
            ].map((feature, idx) => (
              <div key={idx} className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-primary/30">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== USE CASES =================== */}
      <section id="use-cases" className="border-t bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for every team
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Whether you ship code, products, or campaigns &mdash; {APP_NAME} adapts to your workflow.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Code2,
                title: "Software Engineering",
                sub: "Ship code faster",
                points: ["Sprint planning with story points", "WIP-limited Kanban boards", "Burndown charts & velocity tracking", "Planning Poker for estimation"],
                color: "text-blue-600",
                bg: "bg-blue-500/10",
              },
              {
                icon: FlaskConical,
                title: "R&D / Product Development",
                sub: "Manage Stage-Gate processes",
                points: ["Waterfall phases with Gantt charts", "Quality gates (DoR & DoD)", "WSJF for portfolio prioritization", "Cross-functional team tagging"],
                color: "text-purple-600",
                bg: "bg-purple-500/10",
              },
              {
                icon: Megaphone,
                title: "Marketing Teams",
                sub: "Launch campaigns on time",
                points: ["Campaign timeline on Gantt", "Task-level sprint boards", "Stakeholder access via guest links", "Custom fields for any data"],
                color: "text-pink-600",
                bg: "bg-pink-500/10",
              },
              {
                icon: Building2,
                title: "Construction / Manufacturing",
                sub: "Track milestones end-to-end",
                points: ["Phase dependencies with warnings", "Hybrid phases with nested sprints", "Progress tracking per phase", "Excel-like sprint planning grid"],
                color: "text-orange-600",
                bg: "bg-orange-500/10",
              },
            ].map((uc, idx) => (
              <div key={idx} className="rounded-xl border bg-card p-6 flex flex-col">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${uc.bg}`}>
                  <uc.icon className={`h-5 w-5 ${uc.color}`} />
                </div>
                <h3 className="text-lg font-semibold">{uc.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{uc.sub}</p>
                <ul className="space-y-2 flex-1">
                  {uc.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== SOCIAL PROOF / STATS =================== */}
      <section className="border-t py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-8 text-center sm:grid-cols-4">
            {[
              { value: "3", label: "Methodologies", sub: "Agile, Waterfall, Hybrid" },
              { value: "< 50ms", label: "UI Latency", sub: "Optimistic drag & drop" },
              { value: "0", label: "Tracking Cookies", sub: "Privacy-first approach" },
              { value: "\u221E", label: "Custom Fields", sub: "Build your own workflow" },
            ].map((stat, idx) => (
              <div key={idx}>
                <p className="text-3xl font-extrabold tracking-tight text-primary">{stat.value}</p>
                <p className="mt-1 text-sm font-semibold">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== PRICING =================== */}
      <section id="pricing" className="border-t bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Scale as your team grows. No hidden fees.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3 max-w-4xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border bg-card p-6 flex flex-col">
              <h3 className="text-lg font-semibold">Free</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">For small teams and personal projects.</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {["Up to 3 projects", "5 team members", "Scrum Boards + Gantt Charts", "Basic WSJF scoring", "Planning Poker"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
              <Link
                href={isLoggedIn ? "/projects" : "/sign-up"}
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                {isLoggedIn ? "Go to Dashboard" : "Get Started"}
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-xl border-2 border-primary bg-card p-6 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">Popular</span>
              </div>
              <h3 className="text-lg font-semibold">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$29</span>
                <span className="text-sm text-muted-foreground">/user/mo</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">For growing teams that need control.</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {["Unlimited projects", "25 team members", "WIP limits & quality gates", "Sprint analytics & burndown", "Custom fields (Form Builder)", "Guest access for stakeholders", "Hybrid methodology"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
              <Link
                href={isLoggedIn ? "/projects" : "/sign-up"}
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {isLoggedIn ? "Go to Dashboard" : "Start Free Trial"}
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-xl border bg-card p-6 flex flex-col">
              <h3 className="text-lg font-semibold">Enterprise</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">Custom</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">For large organizations with complex needs.</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {["Unlimited everything", "SSO & advanced security", "Dedicated support manager", "Custom integrations & API", "On-premise deployment option", "SLA guarantee & audit logs"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:contact@sprintify.org"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =================== CTA BANNER =================== */}
      <section className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to stop choosing between Agile and Waterfall?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join teams that manage projects the way they actually work &mdash; not the way tools force them to.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={isLoggedIn ? "/projects" : "/sign-up"}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              {isLoggedIn ? "Go to Dashboard" : "Start for Free"} <Rocket className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* =================== FOOTER =================== */}
      <footer className="border-t bg-muted/20 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">{APP_NAME}</span>
            </div>

            <nav className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <a href="#use-cases" className="hover:text-foreground transition-colors">Use Cases</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <a href="mailto:contact@sprintify.org" className="hover:text-foreground transition-colors">Contact</a>
            </nav>

            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
