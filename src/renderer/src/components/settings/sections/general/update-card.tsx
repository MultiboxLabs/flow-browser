import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpCircle,
  CheckCircle2,
  ExternalLink,
  InfoIcon,
  RefreshCw,
  XCircle
} from "lucide-react";
import { useAppUpdates } from "@/components/providers/app-updates-provider";
import { cn } from "@/lib/utils";

const DOWNLOAD_PAGE = "https://flow-browser.com/download/";

interface UpdateState {
  currentVersion: string;
  dialogOpen: boolean;
}

export function UpdateCard() {
  const {
    updateStatus,
    isCheckingForUpdates,
    isDownloadingUpdate,
    isInstallingUpdate,
    isAutoUpdateSupported,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  } = useAppUpdates();

  const [state, setState] = useState<UpdateState>({
    currentVersion: "-", // Will be fetched
    dialogOpen: false
  });

  useEffect(() => {
    const getAppInfo = async () => {
      try {
        const appInfo = await flow.app.getAppInfo();
        setState((prev) => ({ ...prev, currentVersion: appInfo.app_version }));
      } catch (error) {
        console.error("Failed to get app info:", error);
        setState((prev) => ({ ...prev, currentVersion: "N/A" }));
      }
    };
    getAppInfo();
  }, []);

  useEffect(() => {
    if (!updateStatus && isAutoUpdateSupported) {
      // Only auto-check if supported
      checkForUpdates();
    }
  }, [checkForUpdates, updateStatus, isAutoUpdateSupported]);

  const openDownloadPage = () => {
    flow.tabs.newTab(DOWNLOAD_PAGE, true);
  };

  const handleInstallUpdate = async () => {
    await installUpdate();
    setState((prev) => ({ ...prev, dialogOpen: false }));
  };

  const isDownloaded = updateStatus?.updateDownloaded === true;
  const updateProgress = updateStatus?.downloadProgress?.percent || 0;
  const hasChecked = updateStatus !== null;
  const hasUpdate = updateStatus?.availableUpdate !== null;
  const availableVersion = updateStatus?.availableUpdate?.version || "";
  const downloadFailed = updateStatus?.downloadProgress?.percent === -1;
  const isUpToDate = hasChecked && !hasUpdate && !isCheckingForUpdates && !isDownloadingUpdate;

  const renderStatusIconAndText = () => {
    if (isCheckingForUpdates) {
      return (
        <>
          <RefreshCw className="h-5 w-5 mr-2 animate-spin text-muted-foreground" />{" "}
          <span className="text-sm text-muted-foreground">Checking for updates...</span>
        </>
      );
    }
    if (downloadFailed) {
      return (
        <>
          <XCircle className="h-5 w-5 mr-2 text-destructive" />{" "}
          <span className="text-sm text-destructive">Download failed for v{availableVersion}</span>
        </>
      );
    }
    if (isDownloadingUpdate) {
      return (
        <>
          <ArrowDownToLine className="h-5 w-5 mr-2 text-primary" />{" "}
          <span className="text-sm text-primary">Downloading v{availableVersion}...</span>
        </>
      );
    }
    if (isDownloaded) {
      return (
        <>
          <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />{" "}
          <span className="text-sm text-green-500">Update v{availableVersion} downloaded</span>
        </>
      );
    }
    if (hasUpdate) {
      return (
        <>
          <InfoIcon className="h-5 w-5 mr-2 text-primary" />{" "}
          <span className="text-sm text-primary">Update available: v{availableVersion}</span>
        </>
      );
    }
    if (isUpToDate) {
      return (
        <>
          <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />{" "}
          <span className="text-sm text-green-500">Flow is up to date</span>
        </>
      );
    }
    return (
      <>
        <InfoIcon className="h-5 w-5 mr-2 text-muted-foreground" />{" "}
        <span className="text-sm text-muted-foreground">Check for browser updates</span>
      </>
    );
  };

  const renderActionButton = () => {
    if (isCheckingForUpdates || isDownloadingUpdate || isInstallingUpdate) {
      return (
        <Button variant="outline" size="sm" disabled className="min-w-[140px]">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          {isInstallingUpdate ? "Installing..." : isDownloadingUpdate ? "Downloading..." : "Checking..."}
        </Button>
      );
    }

    if (downloadFailed) {
      return (
        <Button variant="default" size="sm" onClick={downloadUpdate} className="min-w-[140px]">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry Download
        </Button>
      );
    }

    if (isDownloaded) {
      return (
        <Dialog open={state.dialogOpen} onOpenChange={(open) => setState((prev) => ({ ...prev, dialogOpen: open }))}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="min-w-[140px]">
              <ArrowUpCircle className="h-4 w-4" /> Install v{availableVersion}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Install Update to v{availableVersion}?</DialogTitle>
              <DialogDescription>
                The app will close and restart to complete the update. Any unsaved changes may be lost.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, dialogOpen: false }))}>
                Later
              </Button>
              <Button onClick={handleInstallUpdate} disabled={isInstallingUpdate} className="flex items-center gap-2">
                {isInstallingUpdate ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Installing...
                  </>
                ) : (
                  `Install v${availableVersion}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    if (hasUpdate && !isAutoUpdateSupported) {
      return (
        <Button variant="default" size="sm" onClick={openDownloadPage} className="min-w-[140px]">
          <ExternalLink className="h-4 w-4 mr-2" /> Download Manually
        </Button>
      );
    }

    if (hasUpdate && isAutoUpdateSupported) {
      return (
        <Button variant="default" size="sm" onClick={downloadUpdate} className="min-w-[140px]">
          <ArrowDownToLine className="h-4 w-4 mr-2" /> Download v{availableVersion}
        </Button>
      );
    }

    // Default: Up to date or initial state, allow manual check
    return (
      <Button
        variant={isUpToDate ? "outline" : "default"}
        size="sm"
        onClick={checkForUpdates}
        className="min-w-[140px]"
      >
        <RefreshCw className="h-4 w-4 mr-2" /> {isUpToDate ? "Check Again" : "Check for Updates"}
      </Button>
    );
  };

  return (
    <div className="remove-app-drag rounded-lg border p-6 bg-card text-card-foreground">
      <div className="mb-4">
        <h3 className="text-xl font-semibold tracking-tight">Updates</h3>
        <p className="text-sm text-muted-foreground mt-1">Current Version: {state.currentVersion}</p>
      </div>

      <div className="space-y-4">
        {/* Status and Action Button Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border rounded-md bg-muted/30">
          <div className="flex items-center flex-grow">{renderStatusIconAndText()}</div>
          <div className="flex-shrink-0 self-stretch sm:self-center">{renderActionButton()}</div>
        </div>

        {/* Download Progress */}
        {isDownloadingUpdate && !downloadFailed && (
          <div className="pt-2 px-1">
            <Progress value={updateProgress} className="w-full h-2" />
            <div className="flex justify-end text-xs text-muted-foreground mt-1">
              <span>{Math.round(updateProgress)}%</span>
            </div>
          </div>
        )}

        {/* Platform not supported warning */}
        {hasChecked && hasUpdate && !isAutoUpdateSupported && (
          <div
            className={cn(
              "rounded-md border p-3 mt-4 text-sm",
              "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400"
            )}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="font-medium">Automatic updates are not supported on this platform.</div>
            </div>
            <div className="mt-1.5 pl-7 text-xs">
              Please download v{availableVersion} manually from our website.
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto ml-1 text-xs text-orange-700 dark:text-orange-400 hover:underline"
                onClick={openDownloadPage}
              >
                Go to Downloads <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
