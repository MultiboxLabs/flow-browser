import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GlobeIcon, HeartIcon } from "lucide-react";

export function SetAsDefaultBrowserSetting() {
  const isDefault: boolean = false;

  const setDefaultBrowser = () => {
    flow.app.setDefaultBrowser();
  };

  return (
    <div className="flex flex-row items-center justify-between gap-2 h-10">
      <Label>Set as Default Browser</Label>
      {!isDefault && (
        <Button variant="outline" className="h-fit py-1 px-3" onClick={setDefaultBrowser}>
          <GlobeIcon />
          Set to Flow
        </Button>
      )}
      {isDefault && (
        <Button variant="outline" className="h-fit py-1 px-3" disabled>
          <HeartIcon />
          Thank you for choosing us!
        </Button>
      )}
    </div>
  );
}
