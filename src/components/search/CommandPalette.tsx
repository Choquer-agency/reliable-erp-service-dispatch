"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useDebounce } from "@/hooks/useDebounce";
import {
  CommandDialog,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Upload,
  Archive,
  Search,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  unassigned: "bg-gray-100 text-gray-700",
  assigned: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  on_hold: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
};

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/service-calls", label: "Service Calls", icon: ClipboardList },
  { href: "/technicians", label: "Technicians", icon: Users },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/history", label: "History", icon: Archive },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  const searchResults = useQuery(
    api.serviceCalls.search,
    debouncedQuery.trim() ? { query: debouncedQuery.trim() } : "skip"
  );

  // Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = useCallback(
    (value: string) => {
      setOpen(false);
      setQuery("");
      router.push(value);
    },
    [router]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setQuery("");
      }}
      title="Search"
      description="Search for calls or navigate to a page"
    >
      <Command shouldFilter={false}>
        <CommandInput
          placeholder="Search calls or navigate..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {debouncedQuery.trim() && !searchResults?.length && (
            <CommandEmpty>
              No results for &ldquo;{debouncedQuery}&rdquo;
            </CommandEmpty>
          )}

          {/* Search results */}
          {searchResults && searchResults.length > 0 && (
            <CommandGroup heading="Service Calls">
              {searchResults.map((call) => (
                <CommandItem
                  key={call._id}
                  value={call._id}
                  onSelect={() =>
                    handleSelect(`/service-calls?callId=${call._id}`)
                  }
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {call.rNumber}
                      </span>
                      <span className="font-medium truncate">
                        {call.customerName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {call.machineInfo}
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`ml-auto shrink-0 text-[10px] ${STATUS_COLORS[call.status] ?? ""}`}
                  >
                    {call.status.replace("_", " ")}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Navigation */}
          {!debouncedQuery.trim() && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Navigate">
                {NAV_ITEMS.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.href}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
