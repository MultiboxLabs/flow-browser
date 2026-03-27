import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DownloadRecord, DownloadState } from "~/types/downloads";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FolderOpen, Link2, MoreVertical, Pause, Play, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 1500;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function simplifyUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname;
  } catch {
    return url;
  }
}

function filenameFromRecord(record: DownloadRecord): string {
  if (record.savePath) {
    const parts = record.savePath.split(/[/\\]/);
    return parts[parts.length - 1] || record.suggestedFilename;
  }
  return record.suggestedFilename;
}

function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function daySectionLabel(ts: number): string {
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t1 = t0 - 86400000;
  if (ts >= t0) return "Today";
  if (ts >= t1) return "Yesterday";
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

type DayGroup = { dayStart: number; label: string; items: DownloadRecord[] };

function groupByDay(downloads: DownloadRecord[]): DayGroup[] {
  const map = new Map<number, DownloadRecord[]>();
  for (const dl of downloads) {
    const key = startOfLocalDay(dl.startTime);
    const list = map.get(key) ?? [];
    list.push(dl);
    map.set(key, list);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([dayStart, items]) => ({
      dayStart,
      label: daySectionLabel(dayStart),
      items: items.sort((a, b) => b.startTime - a.startTime)
    }));
}

function isActive(state: DownloadState): boolean {
  return state === "progressing" || state === "paused";
}

function IconButton({
  onClick,
  label,
  children,
  className
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          aria-label={label}
          className={cn(
            "size-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer",
            className
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function DownloadCard({
  record,
  invalidate,
  fileMissing
}: {
  record: DownloadRecord;
  invalidate: () => void;
  fileMissing: boolean;
}) {
  const filename = filenameFromRecord(record);
  const progress = record.totalBytes > 0 ? Math.round((record.receivedBytes / record.totalBytes) * 100) : 0;
  const active = isActive(record.state);

  const handlePause = async () => {
    const ok = await flow.downloads.pause(record.id);
    if (ok) invalidate();
    else toast.error("Could not pause download");
  };

  const handleResume = async () => {
    const ok = await flow.downloads.resume(record.id);
    if (ok) invalidate();
    else toast.error("Could not resume download");
  };

  const handleCancel = async () => {
    const ok = await flow.downloads.cancel(record.id);
    if (ok) invalidate();
    else toast.error("Could not cancel download");
  };

  const handleShowInFolder = async () => {
    const ok = await flow.downloads.showInFolder(record.id);
    if (!ok) toast.error("File not found");
  };

  const handleOpenFile = async () => {
    const ok = await flow.downloads.openFile(record.id);
    if (!ok) toast.error("Could not open file");
  };

  const handleRemove = async () => {
    const ok = await flow.downloads.removeRecord(record.id);
    if (ok) invalidate();
    else toast.error("Could not remove download");
  };

  const handleCopyUrl = () => {
    void navigator.clipboard.writeText(record.url).then(
      () => toast.success("URL copied"),
      () => toast.error("Could not copy URL")
    );
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex items-center gap-4 rounded-xl bg-muted/40 border border-border/40 px-4 py-3.5 transition-colors hover:bg-muted/60">
          {/* File icon */}
          <div className="shrink-0 size-10 rounded-lg bg-muted/80 flex items-center justify-center">
            <FileText className="size-5 text-muted-foreground" />
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            {/* Filename */}
            {record.state === "completed" && !fileMissing ? (
              <button
                onClick={() => void handleOpenFile()}
                className="text-sm text-blue-400 underline truncate block leading-snug text-left font-medium cursor-pointer hover:text-blue-300"
              >
                {filename}
              </button>
            ) : (
              <span
                className={cn(
                  "text-sm text-foreground truncate block leading-snug font-medium",
                  (fileMissing || record.state === "cancelled") && "line-through text-muted-foreground"
                )}
              >
                {filename}
              </span>
            )}

            {/* Subtitle: source URL or status */}
            {active ? (
              <div className="mt-1.5 space-y-1.5">
                <p className="text-xs text-muted-foreground truncate">From {simplifyUrl(record.url)}</p>
                {record.totalBytes > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatBytes(record.receivedBytes)} of {formatBytes(record.totalBytes)}
                      {record.state === "paused" && " - Paused"}
                    </p>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          record.state === "paused" ? "bg-muted-foreground/50" : "bg-blue-500"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </>
                )}
                {record.totalBytes === 0 && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatBytes(record.receivedBytes)}
                    {record.state === "paused" && " - Paused"}
                  </p>
                )}
              </div>
            ) : fileMissing ? (
              <p className="text-xs text-muted-foreground mt-0.5">Deleted</p>
            ) : record.state === "interrupted" ? (
              <p className="text-xs text-yellow-500 mt-0.5">Interrupted</p>
            ) : record.state === "cancelled" ? (
              <p className="text-xs text-muted-foreground mt-0.5">Cancelled</p>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Active: pause/resume + cancel */}
            {record.state === "progressing" && (
              <IconButton onClick={() => void handlePause()} label="Pause">
                <Pause className="size-4" />
              </IconButton>
            )}
            {active && record.state === "paused" && (
              <IconButton onClick={() => void handleResume()} label="Resume">
                <Play className="size-4" />
              </IconButton>
            )}
            {active && (
              <IconButton onClick={() => void handleCancel()} label="Cancel">
                <X className="size-4" />
              </IconButton>
            )}
            {active && (
              <IconButton onClick={handleCopyUrl} label="Copy download link">
                <Link2 className="size-4" />
              </IconButton>
            )}

            {/* Inactive */}
            {!active && (
              <>
                <IconButton onClick={handleCopyUrl} label="Copy download link">
                  <Link2 className="size-4" />
                </IconButton>
                {record.savePath && !fileMissing && (
                  <IconButton onClick={() => void handleShowInFolder()} label="Show in folder">
                    <FolderOpen className="size-4" />
                  </IconButton>
                )}
                <IconButton onClick={() => void handleRemove()} label="Remove from list">
                  <X className="size-4" />
                </IconButton>
                {/* Overflow menu for resumable interrupted downloads */}
                {record.canResume && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label="More actions"
                        className="size-8 inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => void handleResume()}>
                        <Play className="size-4 mr-2" />
                        Resume download
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {record.state === "completed" && !fileMissing && (
          <ContextMenuItem onSelect={() => void handleOpenFile()}>Open file</ContextMenuItem>
        )}
        {record.savePath && !fileMissing && (
          <ContextMenuItem onSelect={() => void handleShowInFolder()}>Show in folder</ContextMenuItem>
        )}
        {!active && record.canResume && (
          <ContextMenuItem onSelect={() => void handleResume()}>Resume download</ContextMenuItem>
        )}
        <ContextMenuItem onSelect={handleCopyUrl}>Copy download link</ContextMenuItem>
        <ContextMenuSeparator />
        {active && (
          <ContextMenuItem variant="destructive" onSelect={() => void handleCancel()}>
            Cancel download
          </ContextMenuItem>
        )}
        <ContextMenuItem variant="destructive" onSelect={() => void handleRemove()}>
          Remove from list
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function DownloadsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 300);
    return () => window.clearTimeout(t);
  }, [search]);

  const [fileExistence, setFileExistence] = useState<Record<string, boolean>>({});

  const { data, isError, isPending, refetch } = useQuery({
    queryKey: ["downloads"],
    queryFn: () => flow.downloads.list(),
    refetchInterval: POLL_INTERVAL_MS
  });

  useEffect(() => {
    if (isError) toast.error("Could not load downloads");
  }, [isError]);

  // Check file existence for non-active downloads that have a savePath
  useEffect(() => {
    if (!data) return;
    const idsToCheck = data.filter((dl) => !isActive(dl.state) && dl.savePath).map((dl) => dl.id);
    if (idsToCheck.length === 0) return;
    void flow.downloads.checkFilesExist(idsToCheck).then(setFileExistence);
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!debouncedSearch) return data;
    return data.filter((dl) => {
      const filename = filenameFromRecord(dl).toLowerCase();
      const url = dl.url.toLowerCase();
      return filename.includes(debouncedSearch) || url.includes(debouncedSearch);
    });
  }, [data, debouncedSearch]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["downloads"] });
  };

  const clearCompleted = async () => {
    await flow.downloads.clearCompleted();
    toast.success("Cleared completed downloads");
    invalidate();
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
                  disabled={!data || data.length === 0}
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
          {isPending ? (
            <div className="py-20 text-center text-muted-foreground text-sm">Loading...</div>
          ) : isError ? (
            <div className="py-20 text-center space-y-3">
              <p className="text-foreground font-medium">Could not load downloads</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()}>
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
                  <DownloadCard
                    key={dl.id}
                    record={dl}
                    invalidate={invalidate}
                    fileMissing={dl.id in fileExistence && !fileExistence[dl.id]}
                  />
                ))}
              </div>
            ))
          )}
        </motion.div>
      </div>
    </TooltipProvider>
  );
}

function App() {
  return (
    <>
      <title>Downloads</title>
      <DownloadsPage />
    </>
  );
}

export default App;
