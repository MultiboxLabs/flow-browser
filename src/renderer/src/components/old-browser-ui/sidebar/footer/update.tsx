import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarMenu } from "@/components/ui/sidebar";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSettings } from "@/components/providers/settings-provider";
import { SettingsInput } from "@/components/settings/sections/general/basic-settings-cards";
import { useAppUpdates } from "@/components/providers/app-updates-provider";
import { Download, RefreshCw, ArrowUpCircle } from "lucide-react";

export function SidebarFooterUpdate() {
  const [expanded, setExpanded] = useState(false);
  const { settings } = useSettings();
  const { updateStatus, isDownloadingUpdate, isInstallingUpdate, downloadUpdate, installUpdate } = useAppUpdates();

  const autoUpdateSetting = settings.find((setting) => setting.id === "autoUpdate");

  const isDownloaded = updateStatus?.updateDownloaded === true;
  const hasUpdate = updateStatus?.availableUpdate !== null;
  const downloadFailed = updateStatus?.downloadProgress && updateStatus.downloadProgress.percent === -1;

  // Return null if no update is available
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

  // Get the appropriate icon and class based on state
  const getButtonIcon = () => {
    if (isInstallingUpdate || isDownloadingUpdate) {
      return <RefreshCw className="h-4 w-4 mr-2 animate-spin" />;
    }
    if (isDownloaded) {
      return <ArrowUpCircle className="h-4 w-4 mr-2" />;
    }
    return <Download className="h-4 w-4 mr-2" />;
  };

  return (
    <SidebarMenu>
      <AnimatePresence>
        <motion.div
          key="update-card"
          initial={{ opacity: 0, y: 20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 10, height: 0 }}
          transition={{
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
          }}
        >
          <motion.div
            initial={{ opacity: 1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={{
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1], // Custom spring-like curve
              scale: { type: "spring", stiffness: 300, damping: 15 }
            }}
            className="outline-none"
          >
            <Card
              onClick={() => setExpanded(!expanded)}
              className={cn(
                "py-1 gap-0",
                "bg-gray-100/80 dark:bg-white/10",
                "border-gray-200 dark:border-border",
                "cursor-pointer overflow-hidden outline-none",
                "shadow-sm hover:shadow-md transition-shadow"
              )}
            >
              <CardHeader className="gap-0">
                <CardTitle className="text-xs text-center font-bold text-gray-800 dark:text-white">
                  New Update Available
                </CardTitle>
              </CardHeader>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.22, 1, 0.36, 1], // Custom smooth curve
                      opacity: { duration: 0.25 }
                    }}
                  >
                    <Separator className="my-1 bg-black/20 dark:bg-border" />
                    <CardContent>
                      <motion.div
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                        className="flex flex-col gap-1.5 text-gray-600 dark:text-gray-300 mt-2"
                      >
                        {autoUpdateSetting && (
                          <div className="flex flex-row justify-between" onClick={(e) => e.stopPropagation()}>
                            <span className="text-sm">Auto Update</span>
                            <SettingsInput setting={autoUpdateSetting} />
                          </div>
                        )}
                        <Button
                          className={cn(
                            "w-full py-1 h-fit cursor-pointer",
                            "bg-blue-600/80 hover:bg-blue-500/90",
                            "text-white dark:bg-white/50",
                            "dark:hover:bg-white/70 dark:text-black transition-colors"
                          )}
                          onClick={onButtonClick}
                          disabled={isInstallingUpdate || isDownloadingUpdate}
                        >
                          {getButtonIcon()}
                          {getButtonText()}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </SidebarMenu>
  );
}
