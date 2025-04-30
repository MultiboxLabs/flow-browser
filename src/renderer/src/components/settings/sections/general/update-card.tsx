import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
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
import { AlertCircle, ExternalLink } from "lucide-react";

const DOWNLOAD_PAGE = "https://github.com/multiboxlabs/flow-browser/";

export function UpdateCard() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [currentVersion] = useState("1.0.0");
  const [availableVersion, setAvailableVersion] = useState("");
  const [isPlatformSupported, setIsPlatformSupported] = useState(false);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      // No-op for now, would call into flow.updates.check() or similar
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate finding an update and platform check
      setUpdateAvailable(true);
      setAvailableVersion("1.1.0");
      setIsPlatformSupported(true);
      setHasCheckedOnce(true);
    } catch (error) {
      console.error("Failed to check for updates:", error);
    } finally {
      setIsChecking(false);
    }
  };

  const openDownloadPage = () => {
    flow.tabs.newTab(DOWNLOAD_PAGE, true);
  };

  const downloadUpdate = async () => {
    setIsDownloading(true);
    try {
      // Simulate download progress
      for (let i = 0; i <= 100; i += 10) {
        setDownloadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      setUpdateDownloaded(true);
    } catch (error) {
      console.error("Failed to download update:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const installUpdate = async () => {
    setIsInstalling(true);
    try {
      // No-op for now, would call into flow.updates.install() or similar
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setDialogOpen(false);
    } catch (error) {
      console.error("Failed to install update:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Updates</CardTitle>
        <CardDescription>
          Current version: {currentVersion}
          {updateAvailable && ` → ${availableVersion} available`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isDownloading && <Progress value={downloadProgress} className="w-full" />}

        {hasCheckedOnce && !isPlatformSupported && (
          <div className="rounded-md bg-destructive/15 border border-destructive p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <div className="font-medium text-destructive">Platform not supported</div>
            </div>
            <div className="mt-2 text-sm text-destructive">
              Auto-updates are not supported on your platform. Please download the update manually.
            </div>
          </div>
        )}

        {!hasCheckedOnce && (
          <Button variant="secondary" className="w-full" disabled={isChecking} onClick={checkForUpdates}>
            {isChecking ? "Checking..." : "Check for Updates"}
          </Button>
        )}

        {updateAvailable && !isPlatformSupported && (
          <Button
            variant="default"
            className="w-full flex items-center justify-center gap-2"
            onClick={openDownloadPage}
          >
            Download Update <ExternalLink className="h-4 w-4" />
          </Button>
        )}

        {updateAvailable && isPlatformSupported && !updateDownloaded && (
          <Button variant="default" className="w-full" disabled={isDownloading} onClick={downloadUpdate}>
            {isDownloading ? "Downloading..." : "Download Update"}
          </Button>
        )}

        {updateDownloaded && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="w-full">
                Install Update
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Install Update?</DialogTitle>
                <DialogDescription>
                  This will close the app and install the update. Any unsaved changes may be lost.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={installUpdate} disabled={isInstalling}>
                  {isInstalling ? "Installing..." : "Install"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {hasCheckedOnce && !updateAvailable && (
          <Button variant="secondary" className="w-full" onClick={checkForUpdates} disabled={isChecking}>
            Check Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
