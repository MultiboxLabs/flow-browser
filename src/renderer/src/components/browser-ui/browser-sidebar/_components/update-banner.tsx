import { useAppUpdates } from "@/components/providers/app-updates-provider";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpCircle, Download, Loader2 } from "lucide-react";

export function UpdateBanner() {
  const { updateStatus, isDownloadingUpdate, isInstallingUpdate, downloadUpdate, installUpdate } = useAppUpdates();

  const isDownloaded = updateStatus?.updateDownloaded === true;
  const hasUpdate = updateStatus?.availableUpdate !== null;
  const downloadFailed = updateStatus?.downloadProgress && updateStatus.downloadProgress.percent === -1;

  // Don't render if no update is available
  if (!hasUpdate && !isDownloaded && !isDownloadingUpdate && !isInstallingUpdate) {
    return null;
  }

  const onActionClick = () => {
    if (isDownloadingUpdate || isInstallingUpdate) return;

    if (isDownloaded) {
      installUpdate();
    } else if (hasUpdate) {
      downloadUpdate();
    }
  };

  const isLoading = isDownloadingUpdate || isInstallingUpdate;

  const getLabel = () => {
    if (isInstallingUpdate) return "Installing\u2026";
    if (isDownloadingUpdate) return "Downloading\u2026";
    if (isDownloaded) return "Restart to Update";
    if (downloadFailed) return "Retry Download";
    return "Update Available";
  };

  const getIcon = () => {
    if (isLoading) {
      return <Loader2 className="size-3.5 animate-spin" />;
    }
    if (isDownloaded) {
      return <ArrowUpCircle className="size-3.5" />;
    }
    return <Download className="size-3.5" />;
  };

  return (
    <AnimatePresence>
      <motion.button
        key="update-banner"
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: "auto", marginTop: 8 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={onActionClick}
        disabled={isLoading}
        className={cn(
          "w-full shrink-0 overflow-hidden rounded-lg",
          "flex items-center justify-center gap-2 px-3 py-2",
          "text-xs font-medium",
          "bg-black/[0.06] dark:bg-white/[0.08]",
          "text-black/70 dark:text-white/70",
          "transition-colors duration-150",
          !isLoading && "cursor-pointer hover:bg-black/[0.10] dark:hover:bg-white/[0.14]",
          !isLoading && "active:bg-black/[0.14] dark:active:bg-white/[0.18]",
          isLoading && "cursor-default"
        )}
      >
        {getIcon()}
        <span>{getLabel()}</span>
      </motion.button>
    </AnimatePresence>
  );
}
