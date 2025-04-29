import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
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
import { ExternalAppPermission } from "@/lib/flow/interfaces/settings/openExternal";
import { toast } from "sonner";

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
    <div className="border rounded-md overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <WebsiteFavicon url={websiteUrl} className="w-5 h-5" />
          <p className="font-medium">{websiteUrl}</p>
        </div>
        <div className="flex items-center">
          <span className="text-xs px-2 py-1 rounded-full bg-muted mr-2">
            {protocols.length} protocol{protocols.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3 space-y-2">
          {protocols.map((protocol) => (
            <motion.div
              key={protocol}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between p-2 rounded-md bg-muted/30"
            >
              <span className="text-sm">{protocol}</span>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 px-2"
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
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, isOpen: open })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Revocation</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke permission for {websiteUrl} to open {confirmDialog.protocol}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
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
              Revoke
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

  const revalidatePermissions = useCallback(() => {
    flow.openExternal.getAlwaysOpenExternal().then((permissions) => {
      setPermissions(permissions);
    });
  }, []);

  const revokePermission = useCallback(
    (url: string, protocol: string) => {
      flow.openExternal.unsetAlwaysOpenExternal(url, protocol).then((success) => {
        if (success) {
          toast.success("Permission revoked!");
          revalidatePermissions();
        } else {
          toast.error("Failed to revoke permission!");
        }
      });
    },
    [revalidatePermissions]
  );

  // Load permissions from Flow API
  useEffect(() => {
    revalidatePermissions();
  }, [revalidatePermissions]);

  // Group permissions by website URL
  const groupedPermissions = permissions.reduce<Record<string, string[]>>((acc, { requestingURL, openingProtocol }) => {
    if (!acc[requestingURL]) {
      acc[requestingURL] = [];
    }
    acc[requestingURL].push(openingProtocol);
    return acc;
  }, {});

  // Filter based on search query
  const filteredWebsites = Object.keys(groupedPermissions).filter(
    (url) =>
      url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupedPermissions[url].some((protocol) => protocol.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">External Applications</h2>
        <p className="text-muted-foreground">
          {"Manage websites and the protocols they're allowed to open automatically"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Protocol Permissions</CardTitle>
          <CardDescription>
            {"Websites that you've allowed to open external applications via protocols automatically"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search websites or protocols..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredWebsites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No matching permissions found" : "No permissions configured"}
            </div>
          ) : (
            <div className="space-y-2">
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

          <div className="border-t pt-4 text-xs text-muted-foreground">
            <p>
              Note: When you revoke a permission, the website will need to request permission again the next time it
              tries to open that protocol.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
