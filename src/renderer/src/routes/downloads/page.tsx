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
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import type { DownloadRecord, DownloadState } from "~/types/downloads";
import {
  CheckCircle2,
  Download,
  ExternalLink,
  File,
  FolderOpen,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Trash2,
  X,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

const POLL_INTERVAL_MS = 1500;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function stateLabel(state: DownloadState): string {
  switch (state) {
    case "progressing":
      return "Downloading";
    case "paused":
      return "Paused";
    case "interrupted":
      return "Interrupted";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

function StateIcon({ state }: { state: DownloadState }) {
  switch (state) {
    case "completed":
      return <CheckCircle2 className="size-4 text-green-500" />;
    case "cancelled":
      return <XCircle className="size-4 text-muted-foreground" />;
    case "interrupted":
      return <XCircle className="size-4 text-yellow-500" />;
    case "paused":
      return <Pause className="size-4 text-muted-foreground" />;
    case "progressing":
      return <Download className="size-4 text-blue-500 animate-pulse" />;
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
  const d = new Date(ts);
  const now = new Date();
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t1 = t0 - 86400000;
  const fullDate = d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  if (ts >= t0) return `Today - ${fullDate}`;
  if (ts >= t1) return `Yesterday - ${fullDate}`;
  return fullDate;
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

function DownloadItem({
  record,
  invalidate
}: {
  record: DownloadRecord;
  invalidate: () => void;
}) {
  const filename = filenameFromRecord(record);
  const progress =
    record.totalBytes > 0 ? Math.round((record.receivedBytes / record.totalBytes) * 100) : 0;

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
    if (ok) {
      toast.success("Removed from downloads");
      invalidate();
    } else {
      toast.error("Could not remove download");
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <li className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors group cursor-default">
          <div className="shrink-0">
            <File className="size-5 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground truncate block leading-snug font-medium">
                {filename}
              </span>
            </div>

            {isActive(record.state) && record.totalBytes > 0 && (
              <Progress value={progress} className="h-1.5" />
            )}

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <StateIcon state={record.state} />
              <span>{stateLabel(record.state)}</span>
              {record.totalBytes > 0 && (
                <>
                  <span className="opacity-40">-</span>
                  <span>
                    {formatBytes(record.receivedBytes)}
                    {record.state !== "completed" && ` / ${formatBytes(record.totalBytes)}`}
                  </span>
                </>
              )}
              <span className="opacity-40">-</span>
              <time dateTime={new Date(record.startTime).toISOString()}>
                {formatTime(record.startTime)}
              </time>
            </div>
          </div>

          {/* Inline actions */}
          <div className="flex items-center gap-1 shrink-0">
            {record.state === "progressing" && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity"
                onClick={() => void handlePause()}
                aria-label="Pause"
              >
                <Pause className="size-3.5" />
              </Button>
            )}
            {(record.state === "paused" || (record.state === "interrupted" && record.canResume)) && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity"
                onClick={() => void handleResume()}
                aria-label="Resume"
              >
                <Play className="size-3.5" />
              </Button>
            )}
            {isActive(record.state) && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity"
                onClick={() => void handleCancel()}
                aria-label="Cancel"
              >
                <X className="size-3.5" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 opacity-0 group-hover:opacity-60 group-focus-within:opacity-60 hover:opacity-100! focus-visible:opacity-100! transition-opacity"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {record.state === "completed" && (
                  <DropdownMenuItem onClick={() => void handleOpenFile()}>
                    <ExternalLink className="size-4 mr-2" />
                    Open file
                  </DropdownMenuItem>
                )}
                {record.savePath && (
                  <DropdownMenuItem onClick={() => void handleShowInFolder()}>
                    <FolderOpen className="size-4 mr-2" />
                    Show in folder
                  </DropdownMenuItem>
                )}
                {(record.state === "completed" || record.savePath) && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => void handleRemove()}>
                  <Trash2 className="size-4 mr-2" />
                  Remove from list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </li>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-52">
        {record.state === "completed" && (
          <ContextMenuItem onSelect={() => void handleOpenFile()}>Open file</ContextMenuItem>
        )}
        {record.savePath && (
          <ContextMenuItem onSelect={() => void handleShowInFolder()}>Show in folder</ContextMenuItem>
        )}
        <ContextMenuItem
          onSelect={() => {
            void navigator.clipboard.writeText(record.url).then(
              () => toast.success("URL copied"),
              () => toast.error("Could not copy URL")
            );
          }}
        >
          Copy download URL
        </ContextMenuItem>
        <ContextMenuSeparator />
        {isActive(record.state) && (
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

  const { data, isError, isPending, refetch } = useQuery({
    queryKey: ["downloads"],
    queryFn: () => flow.downloads.list(),
    refetchInterval: POLL_INTERVAL_MS
  });

  useEffect(() => {
    if (isError) toast.error("Could not load downloads");
  }, [isError]);

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

  const hasActiveDownloads = useMemo(
    () => data?.some((dl) => isActive(dl.state)) ?? false,
    [data]
  );

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["downloads"] });
  };

  const clearCompleted = async () => {
    await flow.downloads.clearCompleted();
    toast.success("Cleared completed downloads");
    invalidate();
  };

  return (
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
                Clear completed
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
        className="max-w-3xl mx-auto w-full px-6 py-6 flex flex-col gap-4"
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
            <Card key={group.dayStart} className="gap-0 py-0 shadow-sm overflow-clip">
              <CardHeader className="sticky top-15 z-5 px-4 py-2.5! border-border/60 gap-0 border-b bg-muted/95 backdrop-blur-sm">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </span>
              </CardHeader>
              <CardContent className="p-1">
                <ul>
                  {group.items.map((dl) => (
                    <DownloadItem key={dl.id} record={dl} invalidate={invalidate} />
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))
        )}

        {filtered.length > 0 && !hasActiveDownloads && (
          <div className="min-h-8 py-4 flex flex-col items-center justify-center gap-1 text-muted-foreground text-sm">
            <span>End of downloads</span>
          </div>
        )}
      </motion.div>
    </div>
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
