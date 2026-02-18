import Link from "next/link";
import { Zap } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const productLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
] as const;

const legalLinks = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/legal/terms" },
  { label: "Cookies", href: "/legal/cookie" },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
                <Zap className="h-4 w-4 text-white" />
              </span>
              <span className="text-base font-semibold text-gray-900">{APP_NAME}</span>
            </Link>
            <p className="mt-6 text-sm text-gray-500">
              Made by Kazım Bayram
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Product</p>
              <ul className="mt-3 space-y-2 text-sm">
                {productLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-gray-600 hover:text-gray-900">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Legal</p>
              <ul className="mt-3 space-y-2 text-sm">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-gray-600 hover:text-gray-900">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} {APP_NAME}
        </div>
      </div>
    </footer>
  );
}
