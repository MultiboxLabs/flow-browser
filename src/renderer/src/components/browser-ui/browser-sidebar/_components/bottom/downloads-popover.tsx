import { PortalPopover } from "@/components/portal/popover";
import { useSpaces } from "@/components/providers/spaces-provider";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DownloadFileIcon } from "@/components/downloads/manager/file-icon";
import { filenameFromRecord, isActive } from "@/components/downloads/manager/utils";
import type { DownloadRecord } from "~/types/downloads";
import { DownloadIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek === 1) return "1 week ago";
  if (diffWeek < 5) return `${diffWeek} weeks ago`;
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

  const handleClick = () => {
    if (dl.state === "completed" && !fileMissing) {
      void flow.downloads.openFile(dl.id);
    } else {
      flow.tabs.newTab("flow://downloads", true);
      setOpen(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
    >
      <DownloadFileIcon
        record={dl}
        className="shrink-0 size-10 rounded-lg border border-border/30 flex items-center justify-center overflow-hidden"
        imageClassName="size-8 object-contain"
        fallbackClassName="size-8 text-muted-foreground"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-foreground truncate leading-snug",
            (fileMissing || dl.state === "cancelled") && "line-through text-muted-foreground"
          )}
        >
          {filename}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate leading-snug">
          {active
            ? dl.state === "paused"
              ? "Paused"
              : "Downloading…"
            : fileMissing
              ? "Deleted"
              : relativeTime(dl.endTime ?? dl.startTime)}
        </p>
      </div>
    </div>
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

  // Fetch on open + listen for changes while open
  useEffect(() => {
    if (!open) return;
    void fetchDownloads();
    const unsubscribe = flow.downloads.onChanged(() => {
      void fetchDownloads();
    });
    return unsubscribe;
  }, [open, fetchDownloads]);

  const active = downloads.filter((d) => isActive(d.state));
  const recent = downloads.filter((d) => !isActive(d.state));
  const shown = [...active, ...recent].slice(0, 5);
  const hasActive = active.length > 0;

  const openDownloadsPage = () => {
    flow.tabs.newTab("flow://downloads", true);
    setOpen(false);
  };

  return (
    <PortalPopover.Root open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10 relative">
          <DownloadIcon strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
          {hasActive && <span className="absolute top-1 right-1 size-2 rounded-full bg-blue-500 animate-pulse" />}
        </Button>
      </PopoverTrigger>
      <PortalPopover.Content className={cn("w-72 p-0 select-none", spaceInjectedClasses)}>
        {shown.length === 0 ? (
          <div className="px-3 py-5 text-center">
            <DownloadIcon className="size-5 mx-auto text-muted-foreground/40 mb-1.5" />
            <p className="text-xs text-muted-foreground">No downloads</p>
          </div>
        ) : (
          <div className="py-1.5 px-1.5 max-h-72 overflow-y-auto flex flex-col gap-0.5">
            {shown.map((dl) => (
              <DownloadRow
                key={dl.id}
                dl={dl}
                fileMissing={dl.id in fileExistence && !fileExistence[dl.id]}
                setOpen={setOpen}
              />
            ))}
          </div>
        )}
        <div className="border-t border-border/50 px-2 py-1.5">
          <div
            onClick={openDownloadsPage}
            className="flex items-center justify-center gap-1.5 px-2 py-1 text-xs text-muted-foreground hover:text-foreground rounded-sm hover:bg-accent cursor-default transition-colors"
          >
            Show all downloads
          </div>
        </div>
      </PortalPopover.Content>
    </PortalPopover.Root>
  );
}
