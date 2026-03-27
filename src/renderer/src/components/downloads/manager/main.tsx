import { useEffect, useMemo, useRef, useState } from "react";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import { Download, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDownloads } from "./provider";
import { DownloadCard } from "./download-card";
import { filenameFromRecord, groupByDay } from "./utils";

export function DownloadsManagerMain() {
  const { downloads, isLoading, isError, refresh } = useDownloads();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return downloads;
    return downloads.filter((dl) => {
      const filename = filenameFromRecord(dl).toLowerCase();
      const url = dl.url.toLowerCase();
      return filename.includes(debouncedSearch) || url.includes(debouncedSearch);
    });
  }, [downloads, debouncedSearch]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const clearCompleted = async () => {
    await flow.downloads.clearCompleted();
    toast.success("Cleared completed downloads");
  };

  return (
    <TooltipProvider delayDuration={400}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Sticky top bar */}
        <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
            <h1 className="text-lg font-semibold text-foreground tracking-tight shrink-0">Downloads</h1>

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search downloads"
                aria-label="Search downloads"
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground transition-[border-color,box-shadow] outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 focus:bg-background"
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground border shrink-0"
                  disabled={downloads.length === 0}
                >
                  <Trash2 className="size-4" />
                  Clear all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear completed downloads?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes completed and cancelled downloads from the list. Files on disk are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void clearCompleted()}>Clear</AlertDialogAction>
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
          className="max-w-3xl mx-auto w-full px-6 py-6 flex flex-col gap-2"
        >
          {isLoading ? (
            <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>
          ) : isError ? (
            <div className="py-20 text-center space-y-3">
              <p className="text-foreground font-medium">Could not load downloads</p>
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Download className="size-10 mx-auto text-muted-foreground mb-3 opacity-40" />
              <p className="text-foreground font-medium">No downloads found</p>
              <p className="text-muted-foreground text-sm mt-1">
                {debouncedSearch ? "Try a different search." : "Files you download appear here."}
              </p>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.dayStart} className="flex flex-col gap-2">
                <h2 className="text-sm font-medium text-foreground mt-4 mb-1 first:mt-0">{group.label}</h2>
                {group.items.map((dl) => (
                  <DownloadCard key={dl.id} record={dl} />
                ))}
              </div>
            ))
          )}
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
