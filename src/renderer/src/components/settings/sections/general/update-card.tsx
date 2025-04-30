import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AlertCircle, ArrowUpCircle, Download, ExternalLink, RefreshCw } from "lucide-react";
import { useAppUpdates } from "@/components/providers/app-updates-provider";

const DOWNLOAD_PAGE = "https://github.com/multiboxlabs/flow-browser/";

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
    currentVersion: "...", // Will be fetched
    dialogOpen: false
  });

  // Get app version
  useEffect(() => {
    const getAppInfo = async () => {
      try {
        const appInfo = await flow.app.getAppInfo();
        setState((prev) => ({ ...prev, currentVersion: appInfo.app_version }));
      } catch (error) {
        console.error("Failed to get app info:", error);
      }
    };

    getAppInfo();
  }, []);

  // Auto-check for updates on component mount
  useEffect(() => {
    if (!updateStatus) {
      checkForUpdates();
    }
  }, [checkForUpdates, updateStatus]);

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
  const downloadFailed = updateStatus?.downloadProgress && updateStatus.downloadProgress.percent === -1;

  const renderStatusText = () => {
    if (downloadFailed) {
      return <span className="text-sm text-destructive">Download failed</span>;
    }
    if (isDownloaded) {
      return <span className="text-sm text-primary">Update downloaded, ready to install</span>;
    }
    if (isDownloadingUpdate) {
      return <span className="text-sm text-muted-foreground">Downloading update...</span>;
    }
    if (hasUpdate) {
      return <span className="text-sm text-primary">Update available: v{availableVersion}</span>;
    }
    if (hasChecked && !hasUpdate) {
      return <span className="text-sm text-muted-foreground">Your browser is up to date</span>;
    }
    if (isCheckingForUpdates) {
      return <span className="text-sm text-muted-foreground">Checking for updates...</span>;
    }
    return <span className="text-sm text-muted-foreground">Check for browser updates</span>;
  };

  const renderActionButton = () => {
    // 1. Initial check (before first check completes)
    if (!hasChecked) {
      return (
        <Button variant="default" size="sm" disabled={isCheckingForUpdates} onClick={checkForUpdates}>
          {isCheckingForUpdates ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            "Check for Updates"
          )}
        </Button>
      );
    }

    // 6. Checked, up to date, and idle -> Show "Check Again"
    if (
      hasChecked &&
      !hasUpdate &&
      !isCheckingForUpdates &&
      !isDownloadingUpdate &&
      !isInstallingUpdate &&
      !isDownloaded
    ) {
      return (
        <Button variant="outline" size="sm" onClick={checkForUpdates}>
          <RefreshCw className="h-3 w-3 mr-2" />
          Check Again
        </Button>
      );
    }

    // Add case for checking *after* the initial check
    if (isCheckingForUpdates) {
      return (
        <Button variant="outline" size="sm" disabled>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Checking...
        </Button>
      );
    }

    // Update available but platform not supported
    if (hasUpdate && !isAutoUpdateSupported) {
      return (
        <Button
          variant="default"
          size="sm"
          className="flex items-center justify-center gap-2"
          onClick={openDownloadPage}
        >
          <Download className="h-4 w-4" />
          Download from Website
          <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
        </Button>
      );
    }

    // Update available and can be auto-updated, not yet downloading or download failed
    if ((hasUpdate && isAutoUpdateSupported && !isDownloaded && !isDownloadingUpdate) || downloadFailed) {
      return (
        <Button
          variant="default"
          size="sm"
          className="flex items-center justify-center gap-2"
          disabled={isDownloadingUpdate}
          onClick={downloadUpdate}
        >
          <Download className="h-4 w-4 mr-1" />
          {downloadFailed ? "Retry Download" : "Download Update"}
        </Button>
      );
    }

    // Downloading
    if (isDownloadingUpdate) {
      return (
        <Button variant="outline" size="sm" disabled>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Downloading...
        </Button>
      );
    }

    // Update downloaded and ready to install
    if (isDownloaded) {
      return (
        <Dialog open={state.dialogOpen} onOpenChange={(open) => setState((prev) => ({ ...prev, dialogOpen: open }))}>
          <DialogTrigger asChild>
            <Button variant="default" size="sm" className="flex items-center justify-center gap-2">
              <ArrowUpCircle className="h-4 w-4 mr-1" />
              Install Now
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
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  "Install Now"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    }

    return null; // Should not happen in normal flow
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Updates</CardTitle>
        <CardDescription>Check for browser updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Version Info and Action Button */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Current Version: {state.currentVersion}</div>
            {renderStatusText()}
          </div>
          {renderActionButton()}
        </div>

        {/* Download Progress */}
        {isDownloadingUpdate && !downloadFailed && (
          <div className="space-y-1 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Downloading update...</span>
              <span>{Math.round(updateProgress)}%</span>
            </div>
            <Progress value={updateProgress} className="w-full h-2" />
          </div>
        )}

        {/* Download Failed Indicator */}
        {downloadFailed && (
          <div className="flex items-center gap-2 text-destructive pt-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Download failed. Please try again.</span>
          </div>
        )}

        {/* Platform not supported warning */}
        {hasChecked && hasUpdate && !isAutoUpdateSupported && (
          <div className="rounded-md bg-destructive/15 border border-destructive/30 p-3 mt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
              <div className="font-medium text-destructive text-sm">
                Auto-updates not supported on this platform yet
              </div>
            </div>
            <div className="mt-1 text-xs text-destructive/90 pl-6">
              Please download and install the update manually from our website.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
