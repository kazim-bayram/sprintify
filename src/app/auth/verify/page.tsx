import Link from "next/link";
import { MailCheck, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Verify your email — Sprintify",
  description: "Check your inbox to verify your email address for Sprintify.",
};

export default function VerifyPage({ searchParams }: { searchParams: { email?: string } }) {
  const email = searchParams.email;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <MailCheck className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We&apos;ve sent a verification link to{" "}
          {email ? <span className="font-medium text-foreground">{email}</span> : "your email address"}.
          Click the link to activate your {APP_NAME} account.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Didn&apos;t receive the email? Check your spam folder, or try signing up again with the correct address.
        </p>
        <div className="mt-6 flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link href="/sign-in" className="inline-flex items-center gap-1.5 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

