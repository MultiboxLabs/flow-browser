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

const DOWNLOAD_PAGE = "https://github.com/multiboxlabs/flow-browser/";

// Using string literals instead of a union type to avoid TypeScript comparison issues
const UPDATE_STATUS = {
  IDLE: "idle",
  CHECKING: "checking",
  DOWNLOADING: "downloading",
  DOWNLOADED: "downloaded",
  INSTALLING: "installing"
} as const;

interface UpdateState {
  status: string;
  progress: number;
  currentVersion: string;
  availableVersion: string;
  isPlatformSupported: boolean;
  hasChecked: boolean;
  updateAvailable: boolean;
  dialogOpen: boolean;
  error: string | null;
}

export function UpdateCard() {
  const [state, setState] = useState<UpdateState>({
    status: UPDATE_STATUS.IDLE,
    progress: 0,
    currentVersion: "1.0.0",
    availableVersion: "",
    isPlatformSupported: false,
    hasChecked: false,
    updateAvailable: false,
    dialogOpen: false,
    error: null
  });

  // Auto-check for updates on component mount
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    setState((prev) => ({ ...prev, status: UPDATE_STATUS.CHECKING }));

    try {
      // No-op for now, would call into flow.updates.check() or similar
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate finding an update and platform check
      setState((prev) => ({
        ...prev,
        status: UPDATE_STATUS.IDLE,
        updateAvailable: true,
        availableVersion: "1.1.0",
        isPlatformSupported: false,
        hasChecked: true
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: UPDATE_STATUS.IDLE,
        error: "Failed to check for updates",
        hasChecked: true
      }));
      console.error("Failed to check for updates:", error);
    }
  };

  const openDownloadPage = () => {
    flow.tabs.newTab(DOWNLOAD_PAGE, true);
  };

  const downloadUpdate = async () => {
    setState((prev) => ({ ...prev, status: UPDATE_STATUS.DOWNLOADING, progress: 0 }));

    try {
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        setState((prev) => ({ ...prev, progress: i }));
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setState((prev) => ({ ...prev, status: UPDATE_STATUS.DOWNLOADED }));
    } catch (error) {
      setState((prev) => ({ ...prev, status: UPDATE_STATUS.IDLE, error: "Failed to download update" }));
      console.error("Failed to download update:", error);
    }
  };

  const installUpdate = async () => {
    setState((prev) => ({ ...prev, status: UPDATE_STATUS.INSTALLING }));

    try {
      // No-op for now, would call into flow.updates.install() or similar
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setState((prev) => ({ ...prev, dialogOpen: false, status: UPDATE_STATUS.IDLE }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: UPDATE_STATUS.IDLE,
        error: "Failed to install update"
      }));
      console.error("Failed to install update:", error);
    }
  };

  const renderStatusIndicator = () => {
    if (state.error) {
      return (
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{state.error}</span>
        </div>
      );
    }

    if (state.updateAvailable) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-primary/10 text-primary border-primary/20">
          <ArrowUpCircle className="h-3 w-3" />
          <span>Update available</span>
        </Badge>
      );
    }

    if (state.hasChecked && !state.updateAvailable) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-muted text-muted-foreground border-muted">
          <CheckCircle2 className="h-3 w-3" />
          <span>Up to date</span>
        </Badge>
      );
    }

    return null;
  };

  const isChecking = state.status === UPDATE_STATUS.CHECKING;
  const isDownloading = state.status === UPDATE_STATUS.DOWNLOADING;
  const isDownloaded = state.status === UPDATE_STATUS.DOWNLOADED;
  const isInstalling = state.status === UPDATE_STATUS.INSTALLING;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Updates</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <span>v{state.currentVersion}</span>
              {state.updateAvailable && (
                <>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-primary font-medium">v{state.availableVersion}</span>
                </>
              )}
            </CardDescription>
          </div>
          {renderStatusIndicator()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-3">
        {/* Download progress indicator */}
        {isDownloading && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Downloading update...</span>
              <span>{state.progress}%</span>
            </div>
            <Progress value={state.progress} className="w-full h-2" />
          </div>
        )}

        {/* Platform not supported warning */}
        {state.hasChecked && state.updateAvailable && !state.isPlatformSupported && (
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
          {!state.hasChecked && (
            <Button variant="default" className="w-full" disabled={isChecking} onClick={checkForUpdates}>
              {isChecking ? (
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
          {state.updateAvailable && !state.isPlatformSupported && (
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
          {state.updateAvailable && state.isPlatformSupported && !isDownloaded && (
            <Button
              variant="default"
              className="w-full flex items-center justify-center gap-2"
              disabled={isDownloading}
              onClick={downloadUpdate}
            >
              {isDownloading ? (
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
                  <DialogTitle>Install Update to v{state.availableVersion}?</DialogTitle>
                  <DialogDescription>
                    The app will close and restart to complete the update. Any unsaved changes may be lost.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 mt-2">
                  <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, dialogOpen: false }))}>
                    Later
                  </Button>
                  <Button onClick={installUpdate} disabled={isInstalling} className="flex items-center gap-2">
                    {isInstalling && (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Installing...
                      </>
                    )}
                    {!isInstalling && "Install Now"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Check again button */}
          {state.hasChecked && !isChecking && !isInstalling && (
            <Button
              variant={state.updateAvailable ? "outline" : "default"}
              size="sm"
              className="w-full"
              onClick={checkForUpdates}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Check Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
