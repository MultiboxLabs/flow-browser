import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react"; // For loading state

const getAppInfo = flow.app.getAppInfo;

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <>
      <div className="text-sm font-medium text-muted-foreground pr-2 py-1.5 break-words">{label}</div>
      <div className="text-sm text-card-foreground col-span-2 pl-2 py-1.5 break-words">{value}</div>
    </>
  );
}

export function BrowserInfoCard() {
  const [appInfo, setAppInfo] = useState<Awaited<ReturnType<typeof getAppInfo>> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getAppInfo()
      .then((info) => {
        setAppInfo(info);
      })
      .catch((error) => {
        console.error("Failed to fetch app info:", error);
        setAppInfo(null); // Ensure UI doesn't show stale/incorrect data
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    // Replaced Card with styled div
    <div className="rounded-lg border bg-card text-card-foreground p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold tracking-tight">Browser Information</h3>
        <p className="text-sm text-muted-foreground mt-1">Details about your Flow Browser installation.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading browser details...</span>
        </div>
      ) : appInfo ? (
        // Using a 3-column grid for label & value to better control alignment and wrapping
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 border-t pt-4">
          <InfoRow label="Browser Name" value="Flow Browser" />
          <InfoRow label="Version" value={appInfo.app_version} />
          <InfoRow label="Build Number" value={appInfo.build_number} />
          <InfoRow label="Engine Version" value={`Chromium ${appInfo.chrome_version}`} />
          <InfoRow label="Operating System" value={appInfo.os} />
          <InfoRow label="Update Channel" value={appInfo.update_channel} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-destructive">
          Could not load browser information.
        </div>
      )}
    </div>
  );
}
