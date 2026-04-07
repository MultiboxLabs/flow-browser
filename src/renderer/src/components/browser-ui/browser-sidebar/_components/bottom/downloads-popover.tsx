import { PortalPopover } from "@/components/portal/popover";
import { useSpaces } from "@/components/providers/spaces-provider";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DownloadFileIcon } from "@/components/downloads/manager/file-icon";
import { filenameFromRecord, formatBytes, isActive } from "@/components/downloads/manager/utils";
import type { DownloadRecord } from "~/types/downloads";
import { DownloadIcon, ChevronRight, AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

function relativeTime(ts: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - ts) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function DownloadRow({
  dl,
  fileMissing,
  setOpen
}: {
  dl: DownloadRecord;
  fileMissing: boolean;
  setOpen: (open: boolean) => void;
}) {
  const filename = filenameFromRecord(dl);
  const active = isActive(dl.state);
  const progress = dl.totalBytes > 0 ? (dl.receivedBytes / dl.totalBytes) * 100 : 0;
  const showBar = active && dl.totalBytes > 0;

  const handleClick = () => {
    if (dl.state === "completed" && !fileMissing) {
      void flow.downloads.openFile(dl.id);
    } else {
      flow.tabs.newTab("flow://downloads", true);
      setOpen(false);
    }
  };

  const statusText = (): string => {
    if (dl.state === "progressing") {
      if (dl.totalBytes > 0) return `${formatBytes(dl.receivedBytes)} of ${formatBytes(dl.totalBytes)}`;
      return formatBytes(dl.receivedBytes);
    }
    if (dl.state === "paused") {
      if (dl.totalBytes > 0) return `${formatBytes(dl.receivedBytes)} of ${formatBytes(dl.totalBytes)}`;
      return "Paused";
    }
    if (dl.state === "completed") {
      if (fileMissing) return "File deleted";
      const size = dl.totalBytes > 0 ? formatBytes(dl.totalBytes) : null;
      const time = relativeTime(dl.endTime ?? dl.startTime);
      return [size, time].filter(Boolean).join(" · ");
    }
    if (dl.state === "interrupted") return "Interrupted";
    if (dl.state === "cancelled") return "Cancelled";
    return "";
  };

  const statusColor =
    dl.state === "progressing"
      ? "text-blue-400"
      : dl.state === "paused"
        ? "text-amber-400"
        : dl.state === "interrupted"
          ? "text-amber-400"
          : "text-muted-foreground";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-accent/50 transition-colors cursor-default"
    >
      {/* File icon */}
      <div className="relative shrink-0">
        <DownloadFileIcon
          record={dl}
          className="size-9 rounded-lg bg-muted/60 border border-border/30 flex items-center justify-center overflow-hidden"
          imageClassName="size-7 object-contain"
          fallbackClassName="size-6 text-muted-foreground"
        />
        {dl.state === "progressing" && (
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-blue-500 ring-[1.5px] ring-background animate-pulse" />
        )}
        {dl.state === "interrupted" && (
          <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-amber-400 ring-[1.5px] ring-background" />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[12.5px] font-medium text-foreground truncate leading-snug",
            (fileMissing || dl.state === "cancelled") && "line-through text-muted-foreground"
          )}
        >
          {filename}
        </p>

        {/* Progress bar */}
        {showBar && (
          <div className="mt-1.5 h-[3px] w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", dl.state === "paused" ? "bg-muted-foreground/50" : "bg-blue-500")}
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        )}

        <div className={cn("flex items-center gap-1 mt-0.5", showBar && "mt-1")}>
          {dl.state === "paused" && (
            <span className="text-[10px] font-medium text-amber-400 leading-none">Paused ·</span>
          )}
          {dl.state === "interrupted" && <AlertTriangle className="size-2.5 text-amber-400 shrink-0" />}
          <p className={cn("text-[11px] truncate leading-snug", statusColor)}>{statusText()}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function DownloadsPopover() {
  const [open, setOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [fileExistence, setFileExistence] = useState<Record<string, boolean>>({});

  const { isCurrentSpaceLight } = useSpaces();
  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  const fetchDownloads = useCallback(async () => {
    try {
      const all = await flow.downloads.list();
      setDownloads(all);
      const idsToCheck = all.filter((d) => !isActive(d.state) && d.savePath).map((d) => d.id);
      if (idsToCheck.length > 0) {
        const existence = await flow.downloads.checkFilesExist(idsToCheck);
        setFileExistence(existence);
      }
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchDownloads();
    const unsubscribe = flow.downloads.onChanged(() => {
      void fetchDownloads();
    });
    return unsubscribe;
  }, [open, fetchDownloads]);

  const shown = [...downloads].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  const activeCount = downloads.filter((d) => isActive(d.state)).length;
  const hasActive = activeCount > 0;

  const openDownloadsPage = () => {
    flow.tabs.newTab("flow://downloads", true);
    setOpen(false);
  };

  return (
    <PortalPopover.Root open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10 relative">
          <DownloadIcon strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
          {hasActive && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-blue-500 animate-pulse" />}
        </Button>
      </PopoverTrigger>

      <PortalPopover.Content className={cn("w-76 p-0 select-none overflow-hidden", spaceInjectedClasses)}>
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground">Downloads</span>
            {activeCount > 0 && (
              <span className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 leading-none">
                {activeCount} active
              </span>
            )}
          </div>
          <button
            onClick={openDownloadsPage}
            className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            View all
            <ChevronRight className="size-3" />
          </button>
        </div>

        <div className="h-px bg-border" />

        {/* List */}
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-8">
            <div className="size-10 rounded-full bg-muted/60 flex items-center justify-center">
              <DownloadIcon className="size-4.5 text-muted-foreground/50" />
            </div>
            <p className="text-xs text-muted-foreground/70">No recent downloads</p>
          </div>
        ) : (
          <div className="p-1.5">
            <AnimatePresence initial={false}>
              {shown.map((dl) => (
                <DownloadRow
                  key={dl.id}
                  dl={dl}
                  fileMissing={dl.id in fileExistence && !fileExistence[dl.id]}
                  setOpen={setOpen}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </PortalPopover.Content>
    </PortalPopover.Root>
  );
}
