import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DownloadRecord } from "~/types/downloads";
import { FileText, FolderOpen, Link2, MoreVertical, Pause, Play, X } from "lucide-react";
import { toast } from "sonner";
import { useDownloads } from "./provider";
import { filenameFromRecord, formatBytes, isActive, simplifyUrl } from "./utils";

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

export function DownloadCard({ record }: { record: DownloadRecord }) {
  const { fileExistence } = useDownloads();
  const fileMissing = record.id in fileExistence && !fileExistence[record.id];
  const filename = filenameFromRecord(record);
  const progress = record.totalBytes > 0 ? Math.round((record.receivedBytes / record.totalBytes) * 100) : 0;
  const active = isActive(record.state);

  const handlePause = async () => {
    const ok = await flow.downloads.pause(record.id);
    if (!ok) toast.error("Could not pause download");
  };

  const handleResume = async () => {
    const ok = await flow.downloads.resume(record.id);
    if (!ok) toast.error("Could not resume download");
  };

  const handleCancel = async () => {
    const ok = await flow.downloads.cancel(record.id);
    if (!ok) toast.error("Could not cancel download");
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
    if (!ok) toast.error("Could not remove download");
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
