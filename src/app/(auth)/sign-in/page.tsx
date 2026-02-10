"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";
import { Zap, ArrowRight, Lock, Mail } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  // Surface generic auth errors from callback route
  if (!message && errorParam === "auth_failed") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    setMessage("Authentication failed. Please try again or contact support.");
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("confirm") || msg.includes("verified")) {
        setMessage("Please verify your email first. Check your inbox for the confirmation link.");
      } else {
        setMessage(error.message);
      }
      setLoading(false);
      return;
    }

    // Successful sign-in
    window.location.href = "/projects";
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left visual panel */}
      <div className="relative hidden w-1/2 items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 px-10 text-slate-100 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_20%,rgba(129,140,248,0.45),transparent),radial-gradient(40%_40%_at_80%_80%,rgba(56,189,248,0.35),transparent)] opacity-60" />
        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700/60">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
              <Zap className="h-3 w-3 text-primary" />
            </span>
            Trusted Hybrid Project Management
          </div>
          <blockquote className="text-2xl font-semibold leading-relaxed">
            “Sprintify changed how we manage complex projects. Our teams run Agile sprints while leadership tracks the
            full roadmap on a single Gantt.”
          </blockquote>
          <p className="text-sm text-slate-300">
            Designed for engineering, product, and operations teams that need both Scrum Boards and enterprise-grade
            planning.
          </p>
          <div className="flex items-center gap-3 pt-4 text-xs text-slate-400">
            <div className="h-px flex-1 bg-linear-to-r from-slate-600/60 to-transparent" />
            <span>Secure by design • Supabase Auth • Postgres</span>
            <div className="h-px flex-1 bg-linear-to-l from-slate-600/60 to-transparent" />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 lg:px-10">
        <div className="relative w-full max-w-md">
          <Card className="border bg-card/95 shadow-lg backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription>
                Sign in to your {APP_NAME} workspace with Google or email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2 bg-white text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <GoogleIcon className="h-4 w-4" />
                <span>Sign in with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
                </div>
              </div>

              {/* Email + password */}
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="pl-8"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="pl-8"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span />
                  {/* Placeholder for future reset flow */}
                  <span>Forgot password? Coming soon.</span>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !email || !password}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              {message && (
                <p className="text-center text-sm text-muted-foreground">{message}</p>
              )}

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="text-primary underline-offset-4 hover:underline">
                  Create one
                </Link>
              </p>
            </CardContent>
          </Card>

          <p className="mt-4 text-right text-xs text-muted-foreground">
            Made by Kazım Bayram
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
