import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettingsTranslations } from "@/lib/i18n";
import { useEffect, useState } from "react";

const getAppInfo = flow.app.getAppInfo;

export function BrowserInfoCard() {
  const { t: tSettings } = useSettingsTranslations();
  const [appInfo, setAppInfo] = useState<Awaited<ReturnType<typeof getAppInfo>> | null>(null);

  useEffect(() => {
    getAppInfo().then((info) => {
      setAppInfo(info);
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tSettings("Browser Information")}</CardTitle>
        <CardDescription>{tSettings("Details about your browser version")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {appInfo ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">{tSettings("Browser Name:")}</div>
            <div className="text-sm">Flow Browser</div>

            <div className="text-sm font-medium">{tSettings("Version:")}</div>
            <div className="text-sm">{appInfo.app_version}</div>

            <div className="text-sm font-medium">{tSettings("Build:")}</div>
            <div className="text-sm">{appInfo.build_number}</div>

            <div className="text-sm font-medium">{tSettings("Engine:")}</div>
            <div className="text-sm">Chromium {appInfo.chrome_version}</div>

            <div className="text-sm font-medium">{tSettings("OS:")}</div>
            <div className="text-sm">{appInfo.os}</div>

            <div className="text-sm font-medium">{tSettings("Update Channel:")}</div>
            <div className="text-sm">{appInfo.update_channel}</div>
          </div>
        ) : (
          <div className="text-sm">Loading...</div>
        )}
      </CardContent>
    </Card>
  );
}
