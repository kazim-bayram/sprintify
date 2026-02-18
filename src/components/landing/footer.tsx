import Link from "next/link";
import { Zap } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const productLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Roadmap", href: "/#roadmap" },
] as const;

const resourceLinks = [
  { label: "Blog", href: "/#blog" },
  { label: "Support", href: "mailto:support@sprintify.org" },
  { label: "Documentation", href: "/#docs" },
] as const;

const legalLinks = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Cookie Policy", href: "/legal/cookie" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                {APP_NAME}
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-300">
              Agile Speed. Waterfall Control.
            </p>

            <p className="mt-6 text-xs text-neutral-400">
              Made by Kazım Bayram
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">Product</p>
            <ul className="mt-4 space-y-3 text-sm">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-neutral-300 transition-colors hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Resources</p>
            <ul className="mt-4 space-y-3 text-sm">
              {resourceLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-neutral-300 transition-colors hover:text-white"
                    rel={l.href.startsWith("mailto:") ? undefined : "noreferrer"}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold">Legal</p>
            <ul className="mt-4 space-y-3 text-sm">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-neutral-300 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-neutral-400">
          © 2026 Sprintify. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

