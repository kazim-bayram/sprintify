/**
 * Layout for the demo environment route (/demo).
 * The GET handler redirects to the project timeline; this layout wraps the brief loading state.
 * Demo banner and guide overlay are shown in the dashboard via DemoUXWrapper (cookie-based).
 */
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      {children}
    </div>
  );
}
