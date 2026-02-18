import { redirect } from "next/navigation";
import { getCurrentUser, getActiveOrganization, getSupabaseAuthUser } from "@/server/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { UnverifiedEmailBanner } from "@/components/layout/unverified-email-banner";
import { DemoUXWrapper } from "@/components/demo/demo-ux-wrapper";

/**
 * Dashboard layout — wraps all authenticated routes with sidebar + topbar.
 * Redirects to sign-in if not authenticated, onboarding if no org.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, supabaseUser] = await Promise.all([
    getCurrentUser(),
    getSupabaseAuthUser(),
  ]);

  if (!user) {
    redirect("/sign-in");
  }

  const orgContext = await getActiveOrganization();

  if (!orgContext) {
    redirect("/onboarding");
  }

  const isUnverified = !!supabaseUser && !supabaseUser.email_confirmed_at;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DemoUXWrapper />
        <UnverifiedEmailBanner isUnverified={isUnverified} email={supabaseUser?.email ?? user.email} />
        <Topbar
          user={{
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
          }}
          orgName={orgContext.organization.name}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
