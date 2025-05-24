import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { SharedExtensionData } from "~/types/extensions";
import { PuzzleIcon } from "lucide-react";

// Keeping this for backward compatibility
export interface Extension {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  version: string;
  path?: string;
  size?: string;
  permissions?: string[];
  inspectViews?: string[];
}

interface ExtensionCardProps {
  extension: SharedExtensionData;
  isProcessing: boolean;
  setExtensionEnabled: (id: string, enabled: boolean) => Promise<boolean>;
  onDetailsClick: (id: string) => void;
  onUninstallClick?: (id: string) => Promise<void>;
}

function ExtensionCard({
  extension,
  isProcessing,
  setExtensionEnabled,
  onDetailsClick,
  onUninstallClick
}: ExtensionCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [iconError, setIconError] = useState(false);

  const onRemoveClick = async () => {
    setIsRemoving(true);

    if (onUninstallClick) {
      await onUninstallClick(extension.id);
    } else {
      const success = await flow.extensions.uninstallExtension(extension.id);
      if (success) {
        toast.success("Extension uninstalled successfully!");
      }
    }

    setIsRemoving(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 rounded-lg flex items-start gap-4 hover:bg-primary/5 border-border border mb-2"
    >
      <div className="flex-shrink-0 w-10 h-10">
        {extension.icon && !iconError ? (
          <img
            src={extension.icon}
            alt={extension.name}
            className="w-full h-full rounded"
            onError={() => setIconError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5 rounded">
            <PuzzleIcon className="w-6 h-6 text-primary/70" />
          </div>
        )}
      </div>
      <div className="flex-grow space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground font-medium">{extension.name}</h3>
          <Switch
            checked={extension.enabled}
            disabled={isProcessing}
            onCheckedChange={() => setExtensionEnabled(extension.id, !extension.enabled)}
            className="ml-4"
          />
        </div>
        <p className="text-muted-foreground text-sm">{extension.description || ""}</p>

        {/* Add error state for extensions that can't be found */}
        {extension.type === "unpacked" && !extension.path && (
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-md mt-2 mb-2">
            <p className="text-xs text-red-600 dark:text-red-400">
              Extension files not found. The extension may have been moved or deleted.
            </p>
            <Button variant="destructive" size="sm" className="mt-2" onClick={onRemoveClick} disabled={isRemoving}>
              Uninstall
            </Button>
          </div>
        )}

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Version {extension.version}</span>
            {extension.type === "unpacked" && (
              <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded-sm">
                Local
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => onDetailsClick(extension.id)}>
              Details
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={onRemoveClick} disabled={isRemoving}>
              Remove
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default ExtensionCard;
