import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GlobeIcon, HeartIcon, Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";

export function SetAsDefaultBrowserSetting() {
  const [isDefault, setIsDefault] = useState<boolean | null>(null);

  useEffect(() => {
    const refetchDefaultBrowser = async () => {
      const isDefault = await flow.app.getDefaultBrowser();
      setIsDefault(isDefault);
    };

    refetchDefaultBrowser();
    const interval = setInterval(refetchDefaultBrowser, 2000);
    return () => clearInterval(interval);
  }, []);

  const setDefaultBrowser = () => {
    flow.app.setDefaultBrowser();
  };

  return (
    <div className="flex flex-row items-center justify-between gap-2 h-10">
      <Label>Set as Default Browser</Label>
      {isDefault === null && <Loader2Icon className="animate-spin" />}
      {isDefault === false && (
        <Button variant="outline" className="h-fit py-1 px-3" onClick={setDefaultBrowser}>
          <GlobeIcon />
          Set to Flow
        </Button>
      )}
      {isDefault === true && (
        <Button variant="outline" className="h-fit py-1 px-3" disabled>
          <HeartIcon />
          Thank you for choosing us!
        </Button>
      )}
    </div>
  );
}
