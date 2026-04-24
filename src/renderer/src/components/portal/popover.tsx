import { useOptionalBrowserSidebar } from "@/components/browser-ui/browser-sidebar/provider";
import { PortalComponent } from "@/components/portal/portal";
import { Popover as BasePopover, PopoverContent as BasePopoverContent } from "@/components/ui/popover";
import { type PopoverRootChangeEventDetails } from "@base-ui/react";
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { ViewLayer } from "~/layers";

export { PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";

interface PopoverContextType {
  open: boolean;
  setOpen: ((open: boolean, eventDetails: PopoverRootChangeEventDetails) => void) | undefined;
}
const PopoverContext = createContext<PopoverContextType | undefined>(undefined);
export function Popover({
  open: userOpen,
  onOpenChange: userSetOpen,
  ...props
}: React.ComponentProps<typeof BasePopover>) {
  const [internalOpen, internalSetOpen] = useState(false);

  const useUser = userOpen !== undefined;

  const open = useUser ? userOpen : internalOpen;
  const setOpen = useUser ? userSetOpen : internalSetOpen;

  const id = useId();
  const sidebar = useOptionalBrowserSidebar();

  useEffect(() => {
    if (open) sidebar?.addActivePopover(id);
    else sidebar?.removeActivePopover(id);
    return () => sidebar?.removeActivePopover(id);
  }, [open, sidebar, id]);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <BasePopover {...props} open={open} onOpenChange={setOpen} />
    </PopoverContext.Provider>
  );
}

/**
 * Set open to true instantly, but wait the given delay before setting open to false to delay removing of the popover.
 * @param value - The value to delay.
 * @param delay - The delay in milliseconds.
 * @returns The delayed value.
 */
function useDelayedOpenValue(value: boolean, delay: number): boolean {
  const [delayedValue, setDelayedValue] = useState(value);

  useEffect(() => {
    if (value === true) {
      setDelayedValue(value);
      return () => {};
    } else {
      const timer = setTimeout(() => {
        setDelayedValue(value);
      }, delay);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [value, delay]);

  return delayedValue;
}

export function PopoverContent({ ...props }: Omit<React.ComponentProps<typeof BasePopoverContent>, "portalContainer">) {
  const { open } = usePopover();
  const delayedOpen = useDelayedOpenValue(open, 200);
  const portalContainerRef = useRef<HTMLDivElement>(null);
  if (!delayedOpen) return null;

  return (
    <>
      <BasePopoverContent {...props} portalContainer={portalContainerRef} />
      <PortalComponent
        visible={delayedOpen}
        autoFocus
        className="w-screen h-screen absolute top-0 left-0"
        zIndex={ViewLayer.POPOVER}
        portalBodyRef={portalContainerRef}
      />
    </>
  );
}

// Hook to use the popover context
export const usePopover = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error("usePopover must be used within a PortalPopover.Root");
  }
  return context;
};
