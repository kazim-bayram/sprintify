"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UnverifiedEmailBannerProps {
  isUnverified: boolean;
  email?: string | null;
}

export function UnverifiedEmailBanner({ isUnverified, email }: UnverifiedEmailBannerProps) {
  const [hidden, setHidden] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? window.localStorage.getItem("sprintify_unverified_banner_hidden")
      : null;
    setHidden(stored === "1");
  }, []);

  if (!isUnverified || hidden) return null;

  async function handleResend() {
    if (!email) {
      toast.error("No email address found for your account.");
      return;
    }

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Verification email sent.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send verification email.";
      toast.error(msg);
    }
  }

  function handleDismiss() {
    setHidden(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sprintify_unverified_banner_hidden", "1");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <div className="space-y-0.5">
          <p className="font-medium">Your email is unverified.</p>
          <p className="text-[11px] text-amber-900/80 dark:text-amber-100/80">
            Some administrative features are locked until you verify your email.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="xs"
          variant="outline"
          className="h-7 px-2 text-[11px]"
          onClick={handleResend}
        >
          <Mail className="mr-1 h-3 w-3" />
          Resend email
        </Button>
        <Button
          size="xs"
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          onClick={handleDismiss}
        >
          Dismiss
        </Button>
      </div>
    </div>
  );
}

