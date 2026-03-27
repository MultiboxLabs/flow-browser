import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getBangs, waitForBangsLoad, type BangEntry } from "@/lib/omnibox-new/bangs-initializer";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";

function getBangDestination(entry: BangEntry): string {
  if (entry.d.includes(".")) {
    return `https://${entry.d}`;
  }

  try {
    return new URL(entry.u.replace("{{{s}}}", "")).origin;
  } catch {
    return entry.u.replace("{{{s}}}", "");
  }
}

function getBangHost(entry: BangEntry): string {
  try {
    return new URL(entry.u.replace("{{{s}}}", "")).hostname.replace(/^www\./, "");
  } catch {
    return entry.d.replace(/^www\./, "");
  }
}

function getBangSearchTokens(entry: BangEntry): string {
  return [entry.t, entry.s, entry.d, entry.c, entry.sc].filter(Boolean).join("\n").toLowerCase();
}

function getBangSortScore(entry: BangEntry, query: string): number {
  if (!query) return 99;

  const bangText = `!${entry.t}`.toLowerCase();
  const shortName = entry.s.toLowerCase();
  const domain = entry.d.toLowerCase();

  if (bangText === query || entry.t.toLowerCase() === query) return 0;
  if (bangText.startsWith(query) || entry.t.toLowerCase().startsWith(query)) return 1;
  if (shortName.startsWith(query)) return 2;
  if (domain.startsWith(query)) return 3;
  if (bangText.includes(query) || entry.t.toLowerCase().includes(query)) return 4;
  if (shortName.includes(query)) return 5;
  if (domain.includes(query)) return 6;
  return 7;
}

function groupBangsByCategory(entries: BangEntry[], query: string) {
  const groups = new Map<string, BangEntry[]>();

  for (const entry of entries) {
    const category = entry.c ?? "Other";
    const list = groups.get(category) ?? [];
    list.push(entry);
    groups.set(category, list);
  }

  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, items]) => ({
      category,
      items: [...items].sort((a, b) => {
        const scoreDelta = getBangSortScore(a, query) - getBangSortScore(b, query);
        if (scoreDelta !== 0) return scoreDelta;
        return a.t.localeCompare(b.t);
      })
    }));
}

function BangsPage() {
  const [bangEntries, setBangEntries] = useState(() => getBangs());
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  useEffect(() => {
    if (bangEntries.length > 0) return;

    let cancelled = false;

    void waitForBangsLoad().then(() => {
      if (cancelled) return;
      startTransition(() => {
        setBangEntries(getBangs());
      });
    });

    return () => {
      cancelled = true;
    };
  }, [bangEntries.length]);

  const groupedBangs = useMemo(() => {
    const filteredBangs = deferredSearch
      ? bangEntries.filter((entry) => getBangSearchTokens(entry).includes(deferredSearch))
      : bangEntries;

    return groupBangsByCategory(filteredBangs, deferredSearch);
  }, [bangEntries, deferredSearch]);

  const resultCount = useMemo(
    () => groupedBangs.reduce((total, group) => total + group.items.length, 0),
    [groupedBangs]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <div className="shrink-0">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Bangs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{resultCount.toLocaleString()} shortcuts</p>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bangs, sites, or categories"
              aria-label="Search bangs"
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 focus:bg-background"
            />
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="max-w-3xl mx-auto w-full px-6 py-6 flex flex-col gap-4"
      >
        {bangEntries.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground text-sm">Loading…</div>
        ) : resultCount === 0 ? (
          <div className="py-20 text-center">
            <p className="text-foreground font-medium">No bangs found</p>
            <p className="text-muted-foreground text-sm mt-1">Try a different search.</p>
          </div>
        ) : (
          groupedBangs.map((group) => (
            <Card key={group.category} className="gap-0 py-0 shadow-sm overflow-clip">
              <CardHeader className="sticky top-15 z-5 px-4 py-2.5! border-border/60 gap-0 border-b bg-muted/95 backdrop-blur-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.category}
                </span>
              </CardHeader>
              <CardContent className="p-1">
                <ul>
                  {group.items.map((entry) => (
                    <li key={entry.t}>
                      <a
                        href={getBangDestination(entry)}
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors no-underline text-inherit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <div className="h-8 min-w-14 px-2 rounded-md border border-border/60 bg-muted/70 shrink-0 flex items-center justify-center">
                          <span className="font-mono text-[11px] text-foreground truncate">!{entry.t}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm text-foreground truncate block leading-snug">{entry.s}</span>
                          <span className="text-[11px] text-muted-foreground truncate block leading-snug">
                            {[entry.sc, getBangHost(entry)].filter(Boolean).join(" • ")}
                          </span>
                        </div>
                      </a>
                    </li>
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
      <title>Bangs</title>
      <BangsPage />
    </>
  );
}

export default App;
