import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { getAppInfo } from "@/lib/flow";

export function BrowserInfoCard() {
  const [appInfo, setAppInfo] = useState<Awaited<ReturnType<typeof getAppInfo>> | null>(null);

  useEffect(() => {
    getAppInfo().then((info) => {
      setAppInfo(info);
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Browser Information</CardTitle>
        <CardDescription>Details about your browser version</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {appInfo ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Browser Name:</div>
            <div className="text-sm">Flow Browser</div>

            <div className="text-sm font-medium">Version:</div>
            <div className="text-sm">{appInfo.app_version}</div>

            <div className="text-sm font-medium">Build:</div>
            <div className="text-sm">{appInfo.build_number}</div>

            <div className="text-sm font-medium">Engine:</div>
            <div className="text-sm">Chromium {appInfo.chrome_version}</div>

            <div className="text-sm font-medium">OS:</div>
            <div className="text-sm">{appInfo.os}</div>

            <div className="text-sm font-medium">Update Channel:</div>
            <div className="text-sm">{appInfo.update_channel}</div>
          </div>
        ) : (
          <div className="text-sm">Loading...</div>
        )}
      </CardContent>
    </Card>
  );
}
