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
import { AlertCircle, ArrowUpCircle, CheckCircle2, Download, ExternalLink, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    currentVersion: "1.0.0",
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
    checkForUpdates();
  }, [checkForUpdates]);

  const openDownloadPage = () => {
    flow.tabs.newTab(DOWNLOAD_PAGE, true);
  };

  const handleInstallUpdate = async () => {
    await installUpdate();
    setState((prev) => ({ ...prev, dialogOpen: false }));
  };

  const renderStatusIndicator = () => {
    if (!updateStatus) return null;

    // Check if there's an available update
    const hasUpdate = updateStatus.availableUpdate !== null;

    // Show error if download failed
    if (updateStatus.downloadProgress && updateStatus.downloadProgress.percent === -1) {
      return (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Download failed</span>
        </div>
      );
    }

    if (hasUpdate) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
          <ArrowUpCircle className="h-3 w-3" />
          <span>Update available</span>
        </Badge>
      );
    }

    if (!hasUpdate) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-muted text-muted-foreground border-muted">
          <CheckCircle2 className="h-3 w-3" />
          <span>Up to date</span>
        </Badge>
      );
    }

    return null;
  };

  const isDownloaded = updateStatus?.updateDownloaded === true;
  const updateProgress = updateStatus?.downloadProgress?.percent || 0;
  const hasChecked = updateStatus !== null;
  const hasUpdate = updateStatus?.availableUpdate !== null;
  const availableVersion = updateStatus?.availableUpdate?.version || "";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Updates</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>v{state.currentVersion}</span>
              {hasUpdate && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-primary font-medium">v{availableVersion}</span>
                </>
              )}
            </CardDescription>
          </div>
          {renderStatusIndicator()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        {/* Download progress indicator */}
        {isDownloadingUpdate && updateStatus?.downloadProgress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Downloading update...</span>
              <span>{Math.round(updateProgress)}%</span>
            </div>
            <Progress value={updateProgress} className="w-full h-2" />
          </div>
        )}

        {/* Platform not supported warning */}
        {hasChecked && hasUpdate && !isAutoUpdateSupported && (
          <div className="rounded-md bg-destructive/15 border border-destructive/30 p-3">
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

        {/* Action buttons */}
        <div className="space-y-2">
          {/* Initial check */}
          {!hasChecked && (
            <Button variant="default" className="w-full" disabled={isCheckingForUpdates} onClick={checkForUpdates}>
              {isCheckingForUpdates ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check for Updates"
              )}
            </Button>
          )}

          {/* Update available but platform not supported */}
          {hasUpdate && !isAutoUpdateSupported && (
            <Button
              variant="default"
              className="w-full flex items-center justify-center gap-2"
              onClick={openDownloadPage}
            >
              <Download className="h-4 w-4" />
              Download from Website
              <ExternalLink className="h-3 w-3 ml-1 opacity-70" />
            </Button>
          )}

          {/* Update available and can be auto-updated */}
          {hasUpdate && isAutoUpdateSupported && !isDownloaded && (
            <Button
              variant="default"
              className="w-full flex items-center justify-center gap-2"
              disabled={isDownloadingUpdate}
              onClick={downloadUpdate}
            >
              {isDownloadingUpdate ? (
                <>
                  <Download className="h-4 w-4 mr-2 animate-pulse" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1" />
                  Download Update
                </>
              )}
            </Button>
          )}

          {/* Update downloaded and ready to install */}
          {isDownloaded && (
            <Dialog
              open={state.dialogOpen}
              onOpenChange={(open) => setState((prev) => ({ ...prev, dialogOpen: open }))}
            >
              <DialogTrigger asChild>
                <Button variant="default" className="w-full flex items-center justify-center gap-2">
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
                  <Button
                    onClick={handleInstallUpdate}
                    disabled={isInstallingUpdate}
                    className="flex items-center gap-2"
                  >
                    {isInstallingUpdate && (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Installing...
                      </>
                    )}
                    {!isInstallingUpdate && "Install Now"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Check again button */}
          {hasChecked && !isCheckingForUpdates && !isInstallingUpdate && (
            <Button variant={hasUpdate ? "outline" : "default"} size="sm" className="w-full" onClick={checkForUpdates}>
              <RefreshCw className="h-3 w-3 mr-2" />
              Check Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
