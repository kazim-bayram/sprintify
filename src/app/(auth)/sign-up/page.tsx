"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";
import { Zap, ArrowRight, Mail, Lock, Users } from "lucide-react";

type Mode = "create" | "join";

export default function SignUpPage() {
  const [mode, setMode] = useState<Mode>("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [teamName, setTeamName] = useState<string | null>(null);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const supabase = createClient();
  const router = useRouter();
  const utils = trpc.useUtils();
  const [checkingCode, setCheckingCode] = useState(false);

  async function handleGoogleSignUp() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/projects`,
      },
    });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  async function handleCheckTeamCode() {
    const code = teamCode.trim();
    if (!code) {
      setTeamName(null);
      setTeamError("Enter a team code to continue.");
      return;
    }
    setTeamName(null);
    setTeamError(null);
    setCheckingCode(true);
    try {
      const org = await utils.organization.lookupByJoinCode.fetch({ code });
      setTeamName(org.name);
      setTeamError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Team code not found. Please check and try again.";
      setTeamName(null);
      setTeamError(message);
    } finally {
      setCheckingCode(false);
    }
  }

  async function handleEmailSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setLoading(false);
      return;
    }

    let emailRedirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;

    if (mode === "join") {
      const code = teamCode.trim().toUpperCase();
      if (!code || !teamName) {
        setMessage("Please validate your Team Code before signing up.");
        setLoading(false);
        return;
      }
      const params = new URLSearchParams({ joinCode: code, next: "/projects" });
      emailRedirectTo = `${window.location.origin}/auth/callback?${params.toString()}`;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    // Go to verify page instead of dashboard
    router.push(`/auth/verify?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left visual panel */}
      <div className="relative hidden w-1/2 items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 px-10 text-slate-100 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_15%_20%,rgba(129,140,248,0.45),transparent),radial-gradient(40%_40%_at_85%_80%,rgba(45,212,191,0.35),transparent)] opacity-70" />
        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-700/60">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/20">
              <Zap className="h-3 w-3 text-primary" />
            </span>
            Enterprise-ready hybrid project management
          </div>
          <h2 className="text-3xl font-semibold leading-tight">
            One platform for Agile teams and Waterfall stakeholders.
          </h2>
          <p className="text-sm text-slate-300">
            Create a new workspace in seconds or join your existing organization with a secure team code. No spreadsheets,
            no chaos, just clear execution.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 lg:px-10">
        <div className="relative w-full max-w-md">
          <Card className="border bg-card/95 shadow-lg backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create your {APP_NAME} account
              </CardTitle>
              <CardDescription>
                Start for free. Join a team or create a new workspace in under a minute.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="flex w-full items-center justify-center gap-2 bg-white text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
                onClick={handleGoogleSignUp}
                disabled={loading}
              >
                <GoogleIcon className="h-4 w-4" />
                <span>Sign up with Google</span>
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or use email</span>
                </div>
              </div>

              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-2 rounded-md border bg-muted/40 p-1 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setMode("create"); setTeamName(null); setTeamError(null); }}
                  className={`flex items-center justify-center gap-1.5 rounded px-2 py-1.5 transition-colors ${
                    mode === "create"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap className="h-3 w-3" /> Create Workspace
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("join"); }}
                  className={`flex items-center justify-center gap-1.5 rounded px-2 py-1.5 transition-colors ${
                    mode === "join"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-3 w-3" /> Join Existing Team
                </button>
              </div>

              {/* Join existing team controls */}
              {mode === "join" && (
                <div className="space-y-2 rounded-md border bg-muted/40 p-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="teamCode">Team Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="teamCode"
                        placeholder="e.g., ETI-9X"
                        value={teamCode}
                        onChange={(e) => { setTeamCode(e.target.value.toUpperCase()); setTeamName(null); setTeamError(null); }}
                        disabled={loading || checkingCode}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCheckTeamCode}
                        disabled={loading || checkingCode || !teamCode.trim()}
                      >
                        {checkingCode ? "Checking..." : "Check"}
                      </Button>
                    </div>
                  </div>
                  {teamName && (
                    <p className="text-xs text-emerald-600">
                      Joining: <span className="font-semibold">{teamName}</span>
                    </p>
                  )}
                  {teamError && (
                    <p className="text-xs text-destructive">
                      {teamError}
                    </p>
                  )}
                  {!teamName && !teamError && (
                    <p className="text-xs text-muted-foreground">
                      Ask your admin for the Team Code to join their workspace.
                    </p>
                  )}
                </div>
              )}

              {/* Email + password form */}
              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Work Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
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
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className="pl-8"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || !email || !password || !confirmPassword}>
                  {loading ? "Creating account..." : "Create account"}
                </Button>
              </form>

              {message && (
                <p className="text-center text-sm text-muted-foreground">{message}</p>
              )}

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-primary underline-offset-4 hover:underline">
                  Sign in
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
