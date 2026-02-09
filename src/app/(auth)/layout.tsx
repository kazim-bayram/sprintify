// Force dynamic rendering — auth pages need Supabase credentials at runtime
export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
