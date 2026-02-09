"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderKanban, Ticket, Plus, Settings } from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const searchResults = trpc.search.global.useQuery(
    { query },
    { enabled: open && query.length >= 1 }
  );

  // Cmd+K to toggle
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(path: string) {
    router.push(path);
    setOpen(false);
    setQuery("");
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search tickets, projects, or type a command..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        {!query && (
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => navigate("/projects")}>
              <FolderKanban className="mr-2 h-4 w-4" />
              Go to Projects
            </CommandItem>
            <CommandItem onSelect={() => navigate("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
          </CommandGroup>
        )}

        {/* Search Results: Projects */}
        {searchResults.data?.projects && searchResults.data.projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {searchResults.data.projects.map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => navigate(`/projects/${p.key.toLowerCase()}/board`)}
                >
                  <FolderKanban className="mr-2 h-4 w-4" />
                  <span className="font-mono text-xs mr-2">{p.key}</span>
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Search Results: Tickets */}
        {searchResults.data?.tickets && searchResults.data.tickets.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tickets">
              {searchResults.data.tickets.map((t) => (
                <CommandItem
                  key={t.id}
                  onSelect={() =>
                    navigate(`/projects/${t.project.key.toLowerCase()}/board`)
                  }
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  <span className="font-mono text-xs mr-2">
                    {t.project.key}-{t.number}
                  </span>
                  {t.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
