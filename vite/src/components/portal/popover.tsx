import { PortalComponent, usePortalContext } from "@/components/portal/portal";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { createContext, useContext, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PopoverArrow } from "@radix-ui/react-popover";

type PopoverContextType = {
  open: boolean;
  setOpen: ((open: boolean) => void) | undefined;
};

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

function PortalPopoverRoot({
  open: userOpen,
  onOpenChange: userSetOpen,
  ...props
}: React.ComponentProps<typeof Popover>) {
  const [internalOpen, internalSetOpen] = useState(false);

  const useUser = userOpen !== undefined;

  const open = useUser ? userOpen : internalOpen;
  const setOpen = useUser ? userSetOpen : internalSetOpen;

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <Popover {...props} open={open} onOpenChange={setOpen} />
    </PopoverContext.Provider>
  );
}

function PortalPopoverContent({ children, ...props }: React.ComponentProps<typeof PopoverContent>) {
  const { open } = usePopover();
  const { x, y } = usePortalContext();

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          <PortalComponent x={0} y={0} width={"100vw"} height={"100vh"} zIndex={4}>
            <PopoverContent
              {...props}
              portal={false}
              style={{
                transform: `translate(${x}px, ${y}px)`
              }}
            >
              <PopoverArrow className="fill-popover h-2 w-4 outline-hidden stroke-border" />
              {children}
            </PopoverContent>
          </PortalComponent>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const PortalPopover = {
  Root: PortalPopoverRoot,
  Content: PortalPopoverContent
};

// Hook to use the popover context
export const usePopover = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error("usePopover must be used within a PortalPopover.Root");
  }
  return context;
};
