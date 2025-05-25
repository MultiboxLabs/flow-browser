import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/components/ui/input";
import { ChevronRight, Search, ShieldAlert, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { WebsiteFavicon } from "@/components/main/website-favicon";
import { ExternalAppPermission } from "~/flow/interfaces/settings/openExternal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function PermissionItem({
  websiteUrl,
  protocols,
  onRevoke
}: {
  websiteUrl: string;
  protocols: string[];
  onRevoke: (url: string, protocol: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; protocol: string }>({
    isOpen: false,
    protocol: ""
  });

  return (
    <div className="rounded-lg border bg-card text-card-foreground overflow-hidden transition-shadow hover:shadow-md">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => (e.key === "Enter" || e.key === " ") && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <ChevronRight
            className={cn(
              "h-5 w-5",
              "text-muted-foreground flex-shrink-0 transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
          <WebsiteFavicon url={websiteUrl} className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm truncate" title={websiteUrl}>
            {websiteUrl}
          </p>
        </div>
        <div className="flex items-center ml-2 flex-shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {protocols.length} protocol{protocols.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="protocols-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t"
          >
            <div className="p-4 space-y-3 bg-muted/20">
              {protocols.map((protocol, index) => (
                <motion.div
                  key={protocol}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut", delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-md bg-background border shadow-sm"
                >
                  <span className="text-sm font-mono text-primary break-all" title={protocol}>
                    {protocol}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDialog({ isOpen: true, protocol });
                    }}
                  >
                    Revoke
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog({ isOpen: open, protocol: open ? confirmDialog.protocol : "" })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Revocation</DialogTitle>
            <DialogDescription>
              Revoke permission for <span className="font-semibold">{websiteUrl}</span> to open{" "}
              <span className="font-mono text-primary bg-muted px-1 py-0.5 rounded">{confirmDialog.protocol}</span>{" "}
              links?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmDialog({ isOpen: false, protocol: "" })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onRevoke(websiteUrl, confirmDialog.protocol);
                setConfirmDialog({ isOpen: false, protocol: "" });
              }}
            >
              Revoke Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ExternalAppsSettings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [permissions, setPermissions] = useState<ExternalAppPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const revalidatePermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedPermissions = await flow.openExternal.getAlwaysOpenExternal();
      setPermissions(fetchedPermissions);
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
      toast.error("Could not load permissions.");
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokePermission = useCallback(
    async (url: string, protocol: string) => {
      try {
        const success = await flow.openExternal.unsetAlwaysOpenExternal(url, protocol);
        if (success) {
          toast.success("Permission revoked!");
          revalidatePermissions();
        } else {
          toast.error("Failed to revoke permission.");
        }
      } catch (error) {
        console.error("Failed to revoke permission:", error);
        toast.error("An error occurred while revoking permission.");
      }
    },
    [revalidatePermissions]
  );

  useEffect(() => {
    revalidatePermissions();
  }, [revalidatePermissions]);

  const groupedPermissions = permissions.reduce<Record<string, string[]>>((acc, { requestingURL, openingProtocol }) => {
    if (!acc[requestingURL]) {
      acc[requestingURL] = [];
    }
    acc[requestingURL].push(openingProtocol);
    return acc;
  }, {});

  const filteredWebsites = Object.keys(groupedPermissions).filter(
    (url) =>
      url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupedPermissions[url].some((protocol) => protocol.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 remove-app-drag">
      <div>
        <h2 className="text-2xl font-semibold text-card-foreground">External Applications</h2>
        <p className="text-muted-foreground">
          Manage websites and the protocols they are allowed to open automatically.
        </p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold tracking-tight">Protocol Permissions</h3>
          <p className="text-sm text-muted-foreground">
            Websites you have allowed to open external applications via specific protocols.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by website or protocol..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-muted-foreground">Loading permissions...</p>
          </div>
        ) : filteredWebsites.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <ShieldAlert className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-card-foreground">
              {searchQuery ? "No matching permissions found" : "No permissions configured"}
            </p>
            {!searchQuery && (
              <p className="text-sm text-muted-foreground mt-1">
                Websites will ask for permission to open external links.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredWebsites.map((websiteUrl) => (
              <PermissionItem
                key={websiteUrl}
                websiteUrl={websiteUrl}
                protocols={groupedPermissions[websiteUrl]}
                onRevoke={revokePermission}
              />
            ))}
          </div>
        )}

        <div className="border-t pt-4 mt-2">
          <p className="text-xs text-muted-foreground">
            Note: When you revoke a permission, the website will need to ask for permission again the next time it tries
            to open that protocol.
          </p>
        </div>
      </div>
    </div>
  );
}
