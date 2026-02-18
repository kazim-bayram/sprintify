"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function LiveDemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (loading) return;
    setLoading(true);
    router.push("/demo");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-lg border px-8 py-3.5 text-base font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing Live Demo…
        </>
      ) : (
        <>Live Demo</>
      )}
    </button>
  );
}

