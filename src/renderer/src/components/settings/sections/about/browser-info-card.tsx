import { useSettingsTranslations } from "@/lib/i18n";
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
  const { t: tSettings } = useSettingsTranslations();
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
        <h3 className="text-xl font-semibold tracking-tight">{tSettings("sections.about.info.title")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{tSettings("sections.about.info.description")}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>{tSettings("sections.about.info.loading")}</span>
        </div>
      ) : appInfo ? (
        // Using a 3-column grid for label & value to better control alignment and wrapping
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 border-t pt-4">
          <InfoRow label={tSettings("sections.about.info.browser-name")} value="Flow Browser" />
          <InfoRow label={tSettings("sections.about.info.version")} value={appInfo.app_version} />
          <InfoRow label={tSettings("sections.about.info.build")} value={appInfo.build_number} />
          <InfoRow label={tSettings("sections.about.info.engine")} value={`Chromium ${appInfo.chrome_version}`} />
          <InfoRow label={tSettings("sections.about.info.os")} value={appInfo.os} />
          <InfoRow label={tSettings("sections.about.info.update-channel")} value={appInfo.update_channel} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 text-destructive">
          {tSettings("sections.about.info.loading.failed")}
        </div>
      )}
    </div>
  );
}
