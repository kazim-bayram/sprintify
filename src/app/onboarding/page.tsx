"use client";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/constants";

/**
 * Onboarding: Create first organization after sign-up.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: () => {
      toast.success("Organization created!");
      router.push("/projects");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function handleNameChange(value: string) {
    setName(value);
    // Auto-generate slug from name
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50)
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) return;
    createOrg.mutate({ name, slug });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to {APP_NAME}!</CardTitle>
          <CardDescription>
            Create your organization to get started. You can invite your team later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="orgSlug">URL Slug</Label>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>sprintify.app/</span>
                <Input
                  id="orgSlug"
                  placeholder="acme-corp"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  className="flex-1"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createOrg.isPending || !name || !slug}
            >
              {createOrg.isPending ? "Creating..." : "Create Organization"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
