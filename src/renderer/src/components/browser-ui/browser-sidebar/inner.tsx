import { SidebarVariant } from "@/components/browser-ui/main";
import { AttachedDirection, useBrowserSidebar } from "./provider";
import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { AddressBar } from "./_components/address-bar";

export function SidebarInner({ direction, variant }: { direction: AttachedDirection; variant: SidebarVariant }) {
  const { isAnimating } = useBrowserSidebar();
  const { platform } = usePlatform();

  return (
    <>
      {direction === "left" && platform === "darwin" && (
        <div className="flex flex-col p-1">
          <SidebarWindowControlsMacOS offset={variant === "floating" ? 11 : 5} isAnimating={isAnimating} />
          <div className="h-2" />
        </div>
      )}
      <AddressBar />
    </>
  );
}
