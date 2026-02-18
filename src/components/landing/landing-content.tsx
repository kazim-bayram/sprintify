"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Zap as SpeedIcon, Layers, Settings, Check } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { LiveDemoButton } from "./live-demo-button";
import { MethodologySwitcher } from "./methodology-switcher";

interface LandingContentProps {
  isLoggedIn: boolean;
}

export function LandingContent({ isLoggedIn }: LandingContentProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* =================== NAVBAR =================== */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-backdrop-filter:bg-white/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900">{APP_NAME}</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:inline-block"
                >
                  Log in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* =================== HERO =================== */}
      <section className="px-6 py-24 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
          >
            Project management, adapted to your reality.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="mt-5 text-lg text-gray-600 sm:text-xl"
          >
            Don&apos;t force your team into one methodology. Seamlessly switch between Scrum Boards and Gantt Charts in a single project.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-12"
          >
            <MethodologySwitcher />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href={isLoggedIn ? "/projects" : "/sign-up"}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800"
            >
              Get Started for Free <ArrowRight className="h-4 w-4" />
            </Link>
            <LiveDemoButton />
          </motion.div>
        </div>
      </section>

      {/* =================== BENTO GRID =================== */}
      <section id="features" className="border-t border-gray-200 bg-gray-50 px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <SpeedIcon className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Zero Setup.</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Create a project and add your first tasks in seconds. No lengthy onboarding or configuration.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <Layers className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Portfolio View.</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                See all projects in one place. Track progress and health across teams without switching tools.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                <Settings className="h-5 w-5 text-gray-700" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Your Rules.</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Custom phases, labels, and workflows. Adapt the tool to how your team works.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =================== PRICING =================== */}
      <section id="pricing" className="border-t border-gray-200 px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl"
          >
            Fair pricing for growing teams.
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Free</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">$0</p>
                <p className="mt-1 text-sm text-gray-600">Up to 3 projects. No credit card required.</p>
              </div>
              <Link
                href={isLoggedIn ? "/projects" : "/sign-up"}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
              >
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-6 space-y-2 border-t border-gray-200 pt-6">
              {["Scrum boards and Gantt charts", "Up to 5 team members", "Planning and backlog"].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 shrink-0 text-gray-500" strokeWidth={1.5} />
                  {feature}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Footer is rendered by page.tsx */}
    </div>
  );
}
