import { PortalBoundsComponent } from "@/components/portal/portal-bounds";
import { useTabs } from "@/components/providers/tabs-provider";
import { ViewLayer } from "~/layers";
import { useMemo } from "react";

interface TabOverlayPortalProps extends Omit<React.ComponentProps<typeof PortalBoundsComponent>, "bounds" | "visible"> {
  tabId: number;
  visible?: boolean;
}

export function TabOverlayPortal({
  tabId,
  visible = true,
  zIndex = ViewLayer.OVERLAY,
  className,
  style,
  ...props
}: TabOverlayPortalProps) {
  const { tabsData } = useTabs();

  const tab = useMemo(() => {
    return tabsData?.tabs.find((currentTab) => currentTab.id === tabId) ?? null;
  }, [tabId, tabsData]);

  return (
    <PortalBoundsComponent
      {...props}
      className={className}
      zIndex={zIndex}
      bounds={tab?.bounds ?? null}
      visible={visible && Boolean(tab?.visible) && Boolean(tab?.bounds)}
      style={{
        borderRadius: tab?.fullScreen ? 0 : 8,
        overflow: "hidden",
        ...style
      }}
    />
  );
}
