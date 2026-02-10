import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { APP_NAME } from "@/lib/constants";
import {
  Zap, BarChart3, Grid3X3, ShieldCheck, Users, ArrowRight, Check,
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
                  Get Started <ArrowRight className="h-4 w-4" />
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
            <Zap className="h-3 w-3 text-primary" />
            Built for FMCG product development teams
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Agile NPD for{" "}
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              FMCG Leaders
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Manage Stage-Gate, WSJF prioritization, and Scrum in one platform.
            From formula to shelf — track every sprint, every decision, every launch.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={isLoggedIn ? "/projects" : "/sign-up"}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
            >
              {isLoggedIn ? "Go to Dashboard" : "Get Started Free"} <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border px-8 py-3 text-base font-medium transition-colors hover:bg-muted"
            >
              See Features
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Real-time collaboration</span>
          </div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.08),transparent)]" />
      </section>

      {/* =================== FEATURES =================== */}
      <section id="features" className="border-t bg-muted/20 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your NPD team needs
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Purpose-built for R&D, Marketing, Packaging, and Quality teams.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Dynamic WIP Limits",
                description: "Set work-in-progress limits per column. Prevent team overload and enforce pull-based flow automatically.",
                color: "text-red-500 bg-red-500/10",
              },
              {
                icon: BarChart3,
                title: "Planning Poker with WSJF",
                description: "Real-time voting on Story Points, Business Value, Time Criticality, and Risk — with guest access for stakeholders.",
                color: "text-primary bg-primary/10",
              },
              {
                icon: Grid3X3,
                title: "Excel-like Sprint Grid",
                description: "High-density planning interface. Create stories and tasks rapidly with inline editing, just like a spreadsheet.",
                color: "text-green-600 bg-green-500/10",
              },
              {
                icon: Zap,
                title: "WSJF Prioritization",
                description: "Weighted Shortest Job First scoring. Automatically calculate ROI and sort your backlog by true business impact.",
                color: "text-yellow-600 bg-yellow-500/10",
              },
              {
                icon: Users,
                title: "Cross-Functional Teams",
                description: "Department tagging (R&D, Packaging, Quality, Marketing, Supply Chain, Finance) with color-coded workflows.",
                color: "text-purple-600 bg-purple-500/10",
              },
              {
                icon: ShieldCheck,
                title: "Quality Gates (DoR / DoD)",
                description: "Enforce Definition of Ready and Definition of Done checklists. Block moves to Done until criteria are met.",
                color: "text-blue-600 bg-blue-500/10",
              },
            ].map((feature, idx) => (
              <div key={idx} className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-md">
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

      {/* =================== PRICING =================== */}
      <section id="pricing" className="border-t py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start free. Scale as your team grows.
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
              <p className="mt-2 text-sm text-muted-foreground">Perfect for small teams getting started.</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {["Up to 3 projects", "5 team members", "Kanban boards", "Basic WSJF scoring", "Planning Poker"].map((item) => (
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
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">For growing NPD departments.</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {["Unlimited projects", "25 team members", "WIP limits & quality gates", "Sprint analytics & burndown", "Custom fields (Form Builder)", "Guest access for stakeholders"].map((item) => (
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
              <p className="mt-2 text-sm text-muted-foreground">For large FMCG organizations.</p>
              <ul className="mt-6 space-y-2.5 flex-1">
                {["Unlimited everything", "SSO & advanced security", "Dedicated support", "Custom integrations", "On-premise option", "SLA guarantee"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {item}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:sales@sprintify.app"
                className="mt-6 inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Contact Sales
              </a>
            </div>
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
              <a href="#features" className="hover:text-foreground">Features</a>
              <a href="#pricing" className="hover:text-foreground">Pricing</a>
              <a href="mailto:privacy@sprintify.app" className="hover:text-foreground">Privacy</a>
              <a href="mailto:contact@sprintify.app" className="hover:text-foreground">Contact</a>
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
