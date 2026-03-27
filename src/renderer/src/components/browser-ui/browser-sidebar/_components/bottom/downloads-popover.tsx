import { PortalPopover } from "@/components/portal/popover";
import { useSpaces } from "@/components/providers/spaces-provider";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { DownloadRecord, DownloadState } from "~/types/downloads";
import { CheckCircle2, DownloadIcon, ExternalLink, File, Pause, Play, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const POLL_MS = 1500;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function filenameFromRecord(r: DownloadRecord): string {
  if (r.savePath) {
    const parts = r.savePath.split(/[/\\]/);
    return parts[parts.length - 1] || r.suggestedFilename;
  }
  return r.suggestedFilename;
}

function StateIcon({ state, className }: { state: DownloadState; className?: string }) {
  const base = cn("size-3.5 shrink-0", className);
  switch (state) {
    case "completed":
      return <CheckCircle2 className={cn(base, "text-green-500")} />;
    case "cancelled":
    case "interrupted":
      return <XCircle className={cn(base, state === "interrupted" ? "text-yellow-500" : "text-muted-foreground")} />;
    case "paused":
      return <Pause className={cn(base, "text-muted-foreground")} />;
    case "progressing":
      return <DownloadIcon className={cn(base, "text-blue-500 animate-pulse")} />;
  }
}

function DownloadRow({ dl }: { dl: DownloadRecord }) {
  const filename = filenameFromRecord(dl);
  const progress = dl.totalBytes > 0 ? Math.round((dl.receivedBytes / dl.totalBytes) * 100) : 0;
  const isActive = dl.state === "progressing" || dl.state === "paused";

  const handlePause = () => void flow.downloads.pause(dl.id);
  const handleResume = () => void flow.downloads.resume(dl.id);
  const handleCancel = () => void flow.downloads.cancel(dl.id);
  const handleOpen = () => void flow.downloads.openFile(dl.id);

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent/50 group">
      <File className="size-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-foreground truncate leading-snug">{filename}</div>
        {isActive && dl.totalBytes > 0 ? (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Progress value={progress} className="h-1 flex-1" />
            <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{progress}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-0.5">
            <StateIcon state={dl.state} className="size-3" />
            <span className="text-[10px] text-muted-foreground">
              {dl.state === "completed" && formatBytes(dl.receivedBytes)}
              {dl.state === "progressing" && dl.totalBytes === 0 && formatBytes(dl.receivedBytes)}
              {dl.state === "paused" && "Paused"}
              {dl.state === "interrupted" && "Interrupted"}
              {dl.state === "cancelled" && "Cancelled"}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {dl.state === "progressing" && (
          <Button variant="ghost" size="icon" className="size-5" onClick={handlePause}>
            <Pause className="size-3" />
          </Button>
        )}
        {(dl.state === "paused" || (dl.state === "interrupted" && dl.canResume)) && (
          <Button variant="ghost" size="icon" className="size-5" onClick={handleResume}>
            <Play className="size-3" />
          </Button>
        )}
        {isActive && (
          <Button variant="ghost" size="icon" className="size-5" onClick={handleCancel}>
            <X className="size-3" />
          </Button>
        )}
        {dl.state === "completed" && (
          <Button variant="ghost" size="icon" className="size-5" onClick={handleOpen}>
            <ExternalLink className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function DownloadsPopover() {
  const [open, setOpen] = useState(false);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);

  const { isCurrentSpaceLight } = useSpaces();
  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  const fetchDownloads = useCallback(async () => {
    try {
      const all = await flow.downloads.list();
      setDownloads(all);
    } catch {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void fetchDownloads();
    const id = setInterval(() => void fetchDownloads(), POLL_MS);
    return () => clearInterval(id);
  }, [open, fetchDownloads]);

  // Show up to 5 most recent, prioritizing active downloads
  const active = downloads.filter((d) => d.state === "progressing" || d.state === "paused");
  const recent = downloads.filter((d) => d.state !== "progressing" && d.state !== "paused");
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
          {hasActive && (
            <span className="absolute top-1 right-1 size-2 rounded-full bg-blue-500 animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PortalPopover.Content className={cn("w-72 p-0 select-none", spaceInjectedClasses)}>
        {shown.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <DownloadIcon className="size-5 mx-auto text-muted-foreground/40 mb-1.5" />
            <p className="text-xs text-muted-foreground">No downloads</p>
          </div>
        ) : (
          <div className="py-1 px-1 max-h-64 overflow-y-auto">
            {shown.map((dl) => (
              <DownloadRow key={dl.id} dl={dl} />
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
