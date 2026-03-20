import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { WebsiteFavicon } from "@/components/main/website-favicon";
import { simplifyUrl } from "@/lib/url";
import type { BrowsingHistoryVisit } from "~/types/history";
import { Clock, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function daySectionLabel(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t1 = t0 - 86400000;
  const fullDate = d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  if (ts >= t0) return `Today - ${fullDate}`;
  if (ts >= t1) return `Yesterday - ${fullDate}`;
  return fullDate;
}

function groupVisitsByDay(
  visits: BrowsingHistoryVisit[]
): { dayStart: number; label: string; items: BrowsingHistoryVisit[] }[] {
  const map = new Map<number, BrowsingHistoryVisit[]>();
  for (const v of visits) {
    const key = startOfLocalDay(v.visitTime);
    const list = map.get(key) ?? [];
    list.push(v);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([dayStart, items]) => ({
      dayStart,
      label: daySectionLabel(dayStart),
      items: items.sort((a, b) => b.visitTime - a.visitTime)
    }));
}

function HistoryPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visits, setVisits] = useState<BrowsingHistoryVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const v = await flow.history.listVisits(debouncedSearch || undefined);
      setVisits(v);
    } catch {
      toast.error("Could not load history");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const grouped = useMemo(() => groupVisitsByDay(visits), [visits]);

  const openInNewTab = (url: string) => {
    void flow.tabs.newTab(url, true);
  };

  const copyLinkAddress = (url: string) => {
    void navigator.clipboard.writeText(url).then(
      () => toast.success("Link copied"),
      () => toast.error("Could not copy link")
    );
  };

  const removeVisit = async (visitId: number) => {
    const ok = await flow.history.deleteVisit(visitId);
    if (ok) {
      toast.success("Removed from history");
      void refresh();
    } else {
      toast.error("Could not remove visit");
    }
  };

  const removeAllForSite = async (urlRowId: number) => {
    const ok = await flow.history.deleteAllForUrl(urlRowId);
    if (ok) {
      toast.success("Removed visits for this site");
      void refresh();
    } else {
      toast.error("Could not remove site history");
    }
  };

  const clearAll = async () => {
    await flow.history.clearAll();
    toast.success("History cleared");
    void refresh();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <h1 className="text-lg font-semibold text-foreground tracking-tight shrink-0">History</h1>

          {/* Search — centered */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history"
              aria-label="Search history"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 focus:bg-background"
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground border shrink-0"
                disabled={visits.length === 0 && !loading}
              >
                <Trash2 className="size-4" />
                Clear data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear all history?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes every visit in this profile from Flow. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => void clearAll()}>Clear history</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="max-w-3xl mx-auto w-full px-6 py-6 flex flex-col gap-4"
      >
        {loading ? (
          <div className="py-20 text-center text-muted-foreground text-sm">Loading…</div>
        ) : visits.length === 0 ? (
          <div className="py-20 text-center">
            <Clock className="size-10 mx-auto text-muted-foreground mb-3 opacity-40" />
            <p className="text-foreground font-medium">No history found</p>
            <p className="text-muted-foreground text-sm mt-1">
              {debouncedSearch ? "Try a different search." : "Pages you open appear here."}
            </p>
          </div>
        ) : (
          grouped.map((group) => (
            <Card key={group.dayStart} className="overflow-hidden gap-0 py-0 shadow-sm">
              <CardHeader className="px-4 py-2.5! border-border/60 gap-0 border-b bg-muted/30">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </span>
              </CardHeader>
              <CardContent className="p-1">
                <ul>
                  {group.items.map((v) => (
                    <ContextMenu key={v.visitId}>
                      <ContextMenuTrigger asChild>
                        <li className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors group cursor-default">
                          <a
                            href={v.url}
                            rel="noopener noreferrer"
                            className="flex min-w-0 flex-1 items-center gap-3 text-left no-underline text-inherit rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                          >
                            <WebsiteFavicon url={v.url} className="size-5 rounded-sm bg-muted shrink-0 object-cover" />
                            <div className="min-w-0 flex-1">
                              <span className="text-sm text-foreground truncate block leading-snug">
                                {v.title || simplifyUrl(v.url)}
                              </span>
                              <span className="text-[11px] text-muted-foreground truncate block leading-snug">
                                {simplifyUrl(v.url)}
                              </span>
                            </div>
                            <time
                              className="text-[11px] text-muted-foreground tabular-nums shrink-0 hidden sm:block"
                              dateTime={new Date(v.visitTime).toISOString()}
                            >
                              {new Date(v.visitTime).toLocaleTimeString(undefined, {
                                hour: "numeric",
                                minute: "2-digit"
                              })}
                            </time>
                          </a>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 shrink-0 opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity"
                                aria-label="More actions"
                              >
                                <MoreHorizontal className="size-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => void removeVisit(v.visitId)}>Delete</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => void removeAllForSite(v.urlRowId)}>
                                Delete all from this site
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </li>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-52">
                        <ContextMenuItem onSelect={() => window.location.assign(v.url)}>Open link</ContextMenuItem>
                        <ContextMenuItem onSelect={() => openInNewTab(v.url)}>Open in new tab</ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onSelect={() => copyLinkAddress(v.url)}>Copy link address</ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem variant="destructive" onSelect={() => void removeVisit(v.visitId)}>
                          Delete
                        </ContextMenuItem>
                        <ContextMenuItem variant="destructive" onSelect={() => void removeAllForSite(v.urlRowId)}>
                          Delete all from this site
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        )}
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <>
      <title>History</title>
      <HistoryPage />
    </>
  );
}

export default App;
