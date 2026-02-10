"use client";

import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderKanban, FileText, Settings } from "lucide-react";
import { DEPARTMENTS } from "@/lib/constants";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const searchResults = trpc.search.global.useQuery({ query }, { enabled: open && query.length >= 1 });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen((v) => !v); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function navigate(path: string) { router.push(path); setOpen(false); setQuery(""); }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search stories, projects, or type a command..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {!query && (
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => navigate("/projects")}><FolderKanban className="mr-2 h-4 w-4" />Go to Projects</CommandItem>
            <CommandItem onSelect={() => navigate("/settings")}><Settings className="mr-2 h-4 w-4" />Settings</CommandItem>
          </CommandGroup>
        )}
        {searchResults.data?.projects && searchResults.data.projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {searchResults.data.projects.map((p) => (
                <CommandItem key={p.id} onSelect={() => navigate(`/projects/${p.key.toLowerCase()}/board`)}>
                  <FolderKanban className="mr-2 h-4 w-4" /><span className="font-mono text-xs mr-2">{p.key}</span>{p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {searchResults.data?.stories && searchResults.data.stories.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Stories">
              {searchResults.data.stories.map((s) => {
                const dept = DEPARTMENTS.find((d) => d.value === s.department);
                return (
                  <CommandItem key={s.id} onSelect={() => navigate(`/projects/${s.project.key.toLowerCase()}/board`)}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="font-mono text-xs mr-2">{s.project.key}-{s.number}</span>
                    {dept && <span className="mr-1 h-2 w-2 rounded-full inline-block" style={{ backgroundColor: dept.color }} />}
                    {s.title}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
