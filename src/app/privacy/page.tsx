import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Sprintify",
  description: "Sprintify Privacy Policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: February 2026</p>

        <div className="mt-10 prose prose-neutral dark:prose-invert max-w-none space-y-8 text-[15px] leading-relaxed text-foreground/90">

          <section>
            <h2 className="text-xl font-semibold mt-0">1. Introduction</h2>
            <p>
              Welcome to {APP_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). {APP_NAME} is a general-purpose
              hybrid project management platform that helps teams manage complex projects using Agile, Waterfall, or Hybrid
              methodologies. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
              you use our web application and services.
            </p>
            <p>
              By using {APP_NAME}, you agree to the collection and use of information in accordance with this policy.
              If you do not agree, please do not access or use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Information We Collect</h2>
            <p>We collect minimal information necessary to provide our services:</p>
            <h3 className="text-base font-medium mt-4">2.1 Account Information</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Email Address</strong> &mdash; Used for authentication and account identification.</li>
              <li><strong>Display Name</strong> &mdash; Your chosen name for collaboration features.</li>
              <li><strong>Profile Picture</strong> &mdash; Optionally provided via your authentication provider.</li>
            </ul>
            <h3 className="text-base font-medium mt-4">2.2 Usage Data</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Project and task data you create within the platform.</li>
              <li>Basic analytics (page views, feature usage) to improve the product.</li>
              <li>Device type, browser version, and IP address for security and diagnostics.</li>
            </ul>
            <h3 className="text-base font-medium mt-4">2.3 Guest Participants</h3>
            <p>
              Guests who join Planning Poker sessions provide only a display name. No email or account is required.
              A temporary identifier is stored in the guest&apos;s browser local storage and is not linked to any personal account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To create and manage your account and organization.</li>
              <li>To provide, maintain, and improve our platform features.</li>
              <li>To enable real-time collaboration (e.g., Planning Poker, Scrum Boards).</li>
              <li>To send transactional emails (e.g., password reset, account verification).</li>
              <li>To detect and prevent fraud, abuse, or security incidents.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> sell your personal data to third parties. We do <strong>not</strong> use your data
              for advertising or profiling purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Cookies &amp; Local Storage</h2>
            <p>
              We use <strong>essential cookies only</strong> for session management and authentication.
              These cookies are strictly necessary for the platform to function and cannot be disabled.
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Session Cookies</strong> &mdash; Maintain your authenticated session with Supabase Auth.</li>
              <li><strong>Local Storage</strong> &mdash; Stores guest participant identifiers and UI preferences (e.g., sidebar state).</li>
            </ul>
            <p className="mt-3">
              We do not use tracking cookies, analytics cookies, or any third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Data Storage &amp; Security</h2>
            <p>
              Your data is stored securely on infrastructure provided by Supabase (PostgreSQL) and Vercel.
              All data is encrypted in transit (TLS 1.2+) and at rest. We implement industry-standard security
              measures including:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Row-level security policies in the database.</li>
              <li>Organization-scoped data isolation (multi-tenancy).</li>
              <li>Secure authentication via Supabase Auth (OAuth 2.0, Magic Link).</li>
              <li>Regular security reviews and dependency audits.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Third-Party Services</h2>
            <p>We use the following third-party services to operate the platform:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> &mdash; Authentication, database hosting, and real-time services.</li>
              <li><strong>Vercel</strong> &mdash; Application hosting and edge network.</li>
            </ul>
            <p className="mt-3">
              Each provider has their own privacy policy. We encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Data Retention &amp; Deletion</h2>
            <p>
              We retain your data for as long as your account is active. If you choose to delete your account,
              all associated personal data and project data will be permanently removed within 30 days.
            </p>
            <p>
              To request data deletion, please contact us at{" "}
              <a href="mailto:contact@sprintify.org" className="text-primary underline underline-offset-2">contact@sprintify.org</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Data portability (export your data).</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please email{" "}
              <a href="mailto:contact@sprintify.org" className="text-primary underline underline-offset-2">contact@sprintify.org</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. Children&apos;s Privacy</h2>
            <p>
              {APP_NAME} is not intended for use by individuals under the age of 16. We do not knowingly collect
              personal data from children. If you believe a child has provided us with personal information,
              please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes
              by posting the new policy on this page and updating the &ldquo;Last updated&rdquo; date.
              Your continued use of {APP_NAME} after changes are posted constitutes acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:contact@sprintify.org" className="text-primary underline underline-offset-2">contact@sprintify.org</a>
              </li>
              <li><strong>Website:</strong> <a href="https://sprintify.org" className="text-primary underline underline-offset-2">sprintify.org</a></li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
