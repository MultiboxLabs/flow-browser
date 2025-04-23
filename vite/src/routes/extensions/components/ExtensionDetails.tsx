import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SharedExtensionData } from "~/types/extensions";

interface ExtensionDetailsProps {
  extension: SharedExtensionData;
  isDeveloperMode: boolean;
  onBack: () => void;
}

const ExtensionDetails: React.FC<ExtensionDetailsProps> = ({ extension, isDeveloperMode, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center space-x-3">
          <img src={extension.icon} alt={extension.name} className="w-8 h-8 rounded" />
          <h2 className="text-xl font-semibold">{extension.name}</h2>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>On</span>
          <Switch checked={extension.enabled} onCheckedChange={() => {}} />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Description</h3>
          <p className="text-sm text-muted-foreground">{extension.description || "No description available"}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Version</h3>
          <p className="text-sm text-muted-foreground">{extension.version}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Size</h3>
          <p className="text-sm text-muted-foreground">
            {((size) => {
              const units = ["bytes", "KB", "MB", "GB", "TB"];
              let i = 0;
              let sizeValue = size;
              while (sizeValue >= 1024 && i < units.length - 1) {
                sizeValue /= 1024;
                i++;
              }
              return i === 0 ? `${sizeValue} ${units[i]}` : `${sizeValue.toFixed(1)} ${units[i]}`;
            })(extension.size)}
          </p>
        </div>

        {isDeveloperMode && (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-medium">ID</h3>
              <p className="text-sm font-mono bg-muted p-2 rounded">{extension.id}</p>
            </div>

            {extension.inspectViews && extension.inspectViews.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Inspect views</h3>
                <div className="space-y-1">
                  {extension.inspectViews.map((view) => (
                    <Button key={view} variant="link" className="text-sm p-0 h-auto">
                      {view}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {extension.permissions && extension.permissions.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Permissions</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              {extension.permissions.map((permission) => (
                <li key={permission}>• {permission}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Site access</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm">
              Allow this extension to read and change all your data on websites you visit:
            </span>
            <Select defaultValue="all_sites">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_sites">On all sites</SelectItem>
                <SelectItem value="specific_sites">On specific sites</SelectItem>
                <SelectItem value="on_click">On click</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Pin to toolbar</span>
            <Switch defaultChecked />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Allow in Incognito</span>
            <Switch />
          </div>
          <p className="text-xs text-muted-foreground">
            Warning: Flow cannot prevent extensions from recording your browsing history. To disable this extension in
            Incognito mode, unselect this option.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExtensionDetails;
