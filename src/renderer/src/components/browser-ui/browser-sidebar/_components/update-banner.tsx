import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAppUpdates } from "@/components/providers/app-updates-provider";
import { useSettings } from "@/components/providers/settings-provider";
import { SettingsInput } from "@/components/settings/sections/general/basic-settings-cards";
import { cn } from "@/lib/utils";
import { Download, RefreshCw, ArrowUpCircle } from "lucide-react";

export function UpdateBanner() {
  const [hovered, setHovered] = useState(false);
  const { settings } = useSettings();
  const { updateStatus, isDownloadingUpdate, isInstallingUpdate, downloadUpdate, installUpdate } = useAppUpdates();

  const autoUpdateSetting = settings.find((setting) => setting.id === "autoUpdate");

  const isDownloaded = updateStatus?.updateDownloaded === true;
  const hasUpdate = updateStatus?.availableUpdate !== null;
  const downloadFailed = updateStatus?.downloadProgress && updateStatus.downloadProgress.percent === -1;

  if (!hasUpdate && !isDownloaded && !isDownloadingUpdate && !isInstallingUpdate) {
    return null;
  }

  const onButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (isDownloaded) {
      installUpdate();
    } else if (hasUpdate && !isDownloadingUpdate) {
      downloadUpdate();
    }
  };

  const getButtonText = () => {
    if (isInstallingUpdate) return "Installing...";
    if (isDownloadingUpdate) return "Downloading...";
    if (isDownloaded) return "Install Update";
    if (downloadFailed) return "Retry Download";
    return "Download Update";
  };

  const getButtonIcon = () => {
    if (isInstallingUpdate || isDownloadingUpdate) {
      return <RefreshCw className="size-3.5 mr-1.5 animate-spin" />;
    }
    if (isDownloaded) {
      return <ArrowUpCircle className="size-3.5 mr-1.5" />;
    }
    return <Download className="size-3.5 mr-1.5" />;
  };

  return (
    <AnimatePresence>
      <motion.div
        key="update-banner"
        initial={{ opacity: 0, height: 0, marginTop: 0 }}
        animate={{ opacity: 1, height: "auto", marginTop: 8 }}
        exit={{ opacity: 0, height: 0, marginTop: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="shrink-0 overflow-hidden mb-2"
      >
        <div
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={cn(
            "w-full rounded-xl overflow-hidden",
            "border border-black/10 dark:border-white/15",
            "bg-black/5 dark:bg-white/10",
            "transition-colors duration-150",
            "hover:bg-gray-100/90 dark:hover:bg-black/80"
          )}
        >
          {/* Header — always visible */}
          <div className="flex items-center justify-center py-1 px-3">
            <span className="text-xs font-semibold text-black/80 dark:text-white/90">New Update Available</span>
          </div>

          {/* Expanded content — on hover */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                  opacity: { duration: 0.2 }
                }}
                className="overflow-hidden bg-white dark:bg-black/5"
              >
                <div className="mb-0.5 h-px bg-black/10 dark:bg-white/25" />
                <motion.div
                  initial={{ y: 6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.25 }}
                  className="flex flex-col gap-1.5 px-3 pt-1.5 pb-2.5"
                >
                  {autoUpdateSetting && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-black/60 dark:text-white/60">Auto Update</span>
                      <SettingsInput setting={autoUpdateSetting} />
                    </div>
                  )}
                  <button
                    className={cn(
                      "w-full flex items-center justify-center",
                      "rounded-md py-1.5 px-3",
                      "text-xs font-medium",
                      "bg-black/8 dark:bg-white/12",
                      "text-black/80 dark:text-white/90",
                      "transition-colors duration-150",
                      "hover:bg-black/14 dark:hover:bg-white/20",
                      "active:bg-black/18 dark:active:bg-white/25",
                      "disabled:opacity-50 disabled:pointer-events-none",
                      "cursor-pointer"
                    )}
                    onClick={onButtonClick}
                    disabled={(isInstallingUpdate || isDownloadingUpdate) && !downloadFailed}
                  >
                    {getButtonIcon()}
                    {getButtonText()}
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
