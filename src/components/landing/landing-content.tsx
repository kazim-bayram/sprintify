"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight, GanttChart, Kanban, Layers, BarChart3, Settings, TrendingUp } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { LiveDemoButton } from "./live-demo-button";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

interface LandingContentProps {
  isLoggedIn: boolean;
}

export function LandingContent({ isLoggedIn }: LandingContentProps) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* =================== NAVBAR =================== */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-neutral-400 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#why" className="transition-colors hover:text-white">Why Sprintify</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
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
                  className="hidden text-sm font-medium text-neutral-400 transition-colors hover:text-white sm:inline-block"
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
      <section className="relative overflow-hidden px-6 pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-28 lg:pb-40">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-neutral-300">
              <Layers className="h-3.5 w-3.5 text-primary" />
              Hybrid Project Management
            </p>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Agile Speed. Waterfall Control.{" "}
              <span className="bg-linear-to-r from-primary via-violet-400 to-blue-400 bg-clip-text text-transparent">
                One Platform.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-neutral-400 sm:text-xl">
              Stop switching between tools. Manage complex projects with integrated Gantt Charts, Kanban Boards, and Portfolio Dashboards. Perfect for any industry.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={isLoggedIn ? "/projects" : "/sign-up"}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/30"
              >
                Get Started for Free <ArrowRight className="h-5 w-5" />
              </Link>
              <LiveDemoButton />
            </div>
          </motion.div>

          {/* Split View Mockup: Gantt (left) + Kanban (right) */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-14 max-w-5xl"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/80 shadow-2xl shadow-black/40 ring-1 ring-white/5">
              <div className="flex border-b border-white/10 px-4 py-2.5 text-xs font-medium text-neutral-500">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live sync
                </span>
              </div>
              <div className="flex min-h-[320px] sm:min-h-[380px]">
                {/* Left: Gantt-style */}
                <div className="flex w-[45%] flex-col border-r border-white/10 bg-neutral-900/50">
                  <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                    <GanttChart className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-neutral-200">Timeline</span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="space-y-3">
                      {["Foundation", "Development", "QA & Launch"].map((label, i) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="w-24 shrink-0 text-xs text-neutral-500">{label}</span>
                          <div className="h-6 flex-1 overflow-hidden rounded-md bg-white/5">
                            <div
                              className="h-full rounded-md bg-linear-to-r from-primary/80 to-violet-500/80"
                              style={{ width: `${60 + i * 15}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-1">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="h-2 flex-1 rounded-sm bg-white/5" />
                      ))}
                    </div>
                    <p className="mt-2 text-[10px] text-neutral-600">Jan — Dec</p>
                  </div>
                </div>
                {/* Right: Kanban-style */}
                <div className="flex flex-1 flex-col bg-neutral-900/30">
                  <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                    <Kanban className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-neutral-200">Board</span>
                  </div>
                  <div className="flex flex-1 gap-3 p-4">
                    {["To Do", "In Progress", "Done"].map((col, ci) => (
                      <div
                        key={col}
                        className="flex flex-1 flex-col rounded-lg border border-white/10 bg-white/5 p-2"
                      >
                        <p className="mb-2 text-xs font-medium text-neutral-500">{col}</p>
                        <div className="space-y-2">
                          {[1, 2].slice(0, col === "In Progress" ? 2 : 1).map((c) => (
                            <div
                              key={c}
                              className="rounded-md border border-white/10 bg-neutral-800/80 px-2 py-1.5 text-xs text-neutral-300"
                            >
                              Task card {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,255,0.15),transparent)]" />
      </section>

      {/* =================== BENTO: WHY US =================== */}
      <section id="features" className="border-t border-white/10 px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h2 id="why" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Why Sprintify?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-400">
              Built for teams that refuse to choose between speed and control.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <motion.div
              variants={item}
              className="group rounded-2xl border border-white/10 bg-neutral-900/50 p-6 transition-colors hover:border-primary/30 hover:bg-neutral-900/80"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">True Hybrid Engine</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Connect Agile Sprints to Waterfall Milestones. Delays in tasks automatically update your Sprints.
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="group rounded-2xl border border-white/10 bg-neutral-900/50 p-6 transition-colors hover:border-primary/30 hover:bg-neutral-900/80"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Portfolio Command</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                See the big picture. Track budget and health across multiple projects.
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="group rounded-2xl border border-white/10 bg-neutral-900/50 p-6 transition-colors hover:border-primary/30 hover:bg-neutral-900/80"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Settings className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Customizable Workflows</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                From Construction to Code. Define your own phases, labels, and rules.
              </p>
            </motion.div>

            <motion.div
              variants={item}
              className="group rounded-2xl border border-white/10 bg-neutral-900/50 p-6 transition-colors hover:border-primary/30 hover:bg-neutral-900/80 sm:col-span-2 lg:col-span-1"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">Team Velocity</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                Advanced metrics without the setup pain.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* =================== SOCIAL PROOF =================== */}
      <section className="border-t border-white/10 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm font-medium text-neutral-500"
          >
            Trusted by forward-thinking teams.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-neutral-500"
          >
            <span className="text-lg font-semibold text-neutral-400">Acme Corp</span>
            <span className="text-lg font-semibold text-neutral-400">Global Tech</span>
            <span className="text-lg font-semibold text-neutral-400">Nexus Labs</span>
            <span className="text-lg font-semibold text-neutral-400">Atlas Industries</span>
            <span className="text-lg font-semibold text-neutral-400">Vertex Solutions</span>
          </motion.div>
        </div>
      </section>

      {/* =================== PRICING TEASER + CTA =================== */}
      <section id="pricing" className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            Simple pricing. Start free.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-4 text-lg text-neutral-400"
          >
            Free forever plan. Upgrade when you need more.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-10"
          >
            <Link
              href={isLoggedIn ? "/projects" : "/sign-up"}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              Get Started for Free <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer is rendered by page.tsx */}
    </div>
  );
}
