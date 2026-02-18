import { createClient } from "@/lib/supabase/server";
import { LandingContent } from "@/components/landing/landing-content";
import { LandingFooter } from "@/components/landing/footer";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <>
      <LandingContent isLoggedIn={isLoggedIn} />
      <LandingFooter />
    </>
  );
}
