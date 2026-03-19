import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  if (ts >= t0) return "Today";
  if (ts >= t1) return "Yesterday";
  if (now.getTime() - ts < 7 * 86400000) {
    return d.toLocaleDateString(undefined, { weekday: "long" });
  }
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
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

function faviconSrcForPageUrl(url: string): string {
  const u = new URL("flow://favicon");
  u.searchParams.set("url", url);
  return u.toString();
}

function HistoryPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [visits, setVisits] = useState<BrowsingHistoryVisit[]>([]);
  const [loading, setLoading] = useState(true);

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

  const openUrl = (url: string) => {
    flow.navigation.goTo(url);
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
    <div className="max-w-screen min-h-screen bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">History</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Sites you&apos;ve visited recently — grouped by day. Search by title or address.
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0" disabled={visits.length === 0 && !loading}>
                <Trash2 className="size-4" />
                Clear browsing data
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

        <Card className="border-border mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search history"
                className="pl-10"
                aria-label="Search history"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-muted-foreground text-sm">Loading…</div>
            ) : visits.length === 0 ? (
              <div className="py-16 text-center">
                <Clock className="size-10 mx-auto text-muted-foreground mb-3 opacity-60" />
                <p className="text-foreground font-medium">No history found</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {debouncedSearch ? "Try a different search." : "Pages you open appear here."}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[min(70vh,640px)]">
                <div className="p-2">
                  {grouped.map((group) => (
                    <div key={group.dayStart} className="mb-6 last:mb-0">
                      <h2 className="text-sm font-semibold text-muted-foreground px-3 py-2 sticky top-0 bg-card z-1 border-b border-border/60">
                        {group.label}
                      </h2>
                      <ul className="mt-1">
                        {group.items.map((v) => (
                          <li
                            key={v.visitId}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/60 transition-colors group"
                          >
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                              onClick={() => openUrl(v.url)}
                            >
                              <img
                                src={faviconSrcForPageUrl(v.url)}
                                alt=""
                                className="size-8 rounded-md bg-muted shrink-0 object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-foreground truncate">
                                  {v.title || simplifyUrl(v.url)}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">{simplifyUrl(v.url)}</div>
                              </div>
                              <time
                                className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:block"
                                dateTime={new Date(v.visitTime).toISOString()}
                              >
                                {new Date(v.visitTime).toLocaleTimeString(undefined, {
                                  hour: "numeric",
                                  minute: "2-digit"
                                })}
                              </time>
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 shrink-0 opacity-60 group-hover:opacity-100"
                                  aria-label="More actions"
                                >
                                  <MoreHorizontal className="size-4" />
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
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
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
