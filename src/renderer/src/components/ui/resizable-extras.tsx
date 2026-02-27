import { ResizablePanelGroup } from "@/components/ui/resizable";
import { mergeRefs } from "@/lib/merge-refs";
import { type ImperativePanelGroupHandle, type ImperativePanelHandle, Panel } from "@iamevan/react-resizable-panels";
import {
  createContext,
  useCallback,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { flushSync } from "react-dom";

/**
 * Custom hook that provides a stable callback ref which sets state when
 * the handle is assigned, triggering a synchronous re-render (via
 * useLayoutEffect) so context consumers receive the handle before paint.
 */
function usePanelGroupCallbackRef(forwardedRef: React.Ref<ImperativePanelGroupHandle> | undefined) {
  const handleRef = useRef<ImperativePanelGroupHandle | null>(null);
  const [handle, setHandle] = useState<ImperativePanelGroupHandle | null>(null);

  // Stable callback ref — identity never changes so React won't re-call it
  // with null/handle on every render.
  const callbackRef = useCallback(
    (instance: ImperativePanelGroupHandle | null) => {
      handleRef.current = instance;

      // Forward to the consumer's ref
      if (forwardedRef) {
        if (typeof forwardedRef === "function") {
          forwardedRef(instance);
        } else {
          (forwardedRef as React.MutableRefObject<ImperativePanelGroupHandle | null>).current = instance;
        }
      }
    },
    [forwardedRef]
  );

  // After mount (and after refs are assigned), publish the handle via state.
  // useLayoutEffect runs before paint, so the synchronous re-render ensures
  // context consumers see the handle before the first visible frame.
  useLayoutEffect(() => {
    if (handleRef.current !== handle) {
      setHandle(handleRef.current);
    }
  }, [handle]);

  return { callbackRef, handle };
}

export interface ImperativeResizablePanelWrapperHandle {
  getSizePixels: () => number;
}

interface PixelBasedResizablePanelProps extends Omit<
  React.ComponentProps<typeof Panel>,
  "minSize" | "maxSize" | "defaultSize"
> {
  minSizePixels?: number;
  maxSizePixels?: number;
  defaultSizePixels?: number;
  wrapperRef?: React.Ref<ImperativeResizablePanelWrapperHandle>;
}

// Pure utility function - no need for useCallback
function pixelsToPercentage(pixels: number, groupSize: number): number {
  return groupSize > 0 ? (pixels / groupSize) * 100 : 0;
}

const ResizablePanelGroupProvider = createContext<ImperativePanelGroupHandle | null>(null);
export function ResizablePanelGroupWithProvider({ ref, ...props }: React.ComponentProps<typeof ResizablePanelGroup>) {
  const { callbackRef, handle } = usePanelGroupCallbackRef(ref);
  return (
    <ResizablePanelGroupProvider.Provider value={handle}>
      <ResizablePanelGroup ref={callbackRef} {...props} />
    </ResizablePanelGroupProvider.Provider>
  );
}

export function PixelBasedResizablePanel({
  minSizePixels,
  maxSizePixels,
  defaultSizePixels,
  ref,
  wrapperRef,
  onResize: onResizeProp,
  ...props
}: PixelBasedResizablePanelProps) {
  const panelRef = useRef<ImperativePanelHandle>(null);
  const combinedPanelRef = mergeRefs([ref, panelRef]);

  const panelGroup = useContext(ResizablePanelGroupProvider);

  // Track panel group size in state so constraints update reactively
  const [panelGroupSize, setPanelGroupSize] = useState(0);

  // Use ref to track current pixel size
  const currentSizePixelsRef = useRef<number | undefined>(defaultSizePixels);
  const isResizingFromObserverRef = useRef(false);
  const panelElementRef = useRef<HTMLElement | null>(null);

  // Guard: prevent handleResize from corrupting currentSizePixelsRef during
  // initialization. On first render panelGroup is null → library picks an
  // unconstrained default (e.g. 50%). On re-render when panelGroup arrives,
  // the library clamps to maxSize and fires onResize with the wrong value.
  // This flag blocks that update until our deferred resize() corrects it.
  const isSyncingRef = useRef(true);

  // Expose wrapper handle
  useImperativeHandle(wrapperRef, () => ({
    getSizePixels: () => currentSizePixelsRef.current ?? 0
  }));

  // Calculate all percentage constraints in a single memo
  const { defaultSize, minSize, maxSize } = useMemo(() => {
    // Get effective group size (prefer state, fallback to direct measurement)
    let groupSize = panelGroupSize;
    if (groupSize <= 0 && panelGroup) {
      const element = panelGroup.getElement();
      groupSize = element?.getBoundingClientRect().width ?? 0;
    }

    if (groupSize <= 0) {
      return { defaultSize: undefined, minSize: undefined, maxSize: undefined };
    }

    return {
      defaultSize: defaultSizePixels !== undefined ? pixelsToPercentage(defaultSizePixels, groupSize) : undefined,
      minSize: minSizePixels !== undefined ? pixelsToPercentage(minSizePixels, groupSize) : undefined,
      maxSize: maxSizePixels !== undefined ? pixelsToPercentage(maxSizePixels, groupSize) : undefined
    };
  }, [defaultSizePixels, minSizePixels, maxSizePixels, panelGroupSize, panelGroup]);

  // Handle panel resize to track pixel size
  const handleResize = useCallback(
    (size: number, prevSize: number | undefined) => {
      if (!panelGroup) return;
      const panelGroupElement = panelGroup.getElement();
      if (!panelGroupElement) return;

      const panelGroupSizePixels = panelGroupElement.getBoundingClientRect().width;
      const sizePixels = (size / 100) * panelGroupSizePixels;

      // Only update pixel size if this is from user interaction, not from our
      // observer or during the initial sync phase (where the library may fire
      // onResize with a clamped value before we've corrected it).
      if (!isResizingFromObserverRef.current && !isSyncingRef.current) {
        currentSizePixelsRef.current = sizePixels;

        // Update the CSS width to match the new pixel size
        if (panelElementRef.current) {
          const el = panelElementRef.current;
          el.style.minWidth = `${sizePixels}px`;
          el.style.maxWidth = `${sizePixels}px`;
          el.style.width = `${sizePixels}px`;
          el.style.flexBasis = `${sizePixels}px`;
        }
      }

      // Call user's onResize if provided
      onResizeProp?.(size, prevSize);
    },
    [panelGroup, onResizeProp]
  );

  // Apply CSS width locking on mount, even before panelGroup is available.
  // This prevents the sidebar from flashing at an unconstrained size when the
  // component tree remounts (e.g. after leaving fullscreen).
  useLayoutEffect(() => {
    if (!panelRef.current) return;
    const panelElement = panelRef.current.getElement();
    if (!panelElement) return;

    panelElementRef.current = panelElement;

    if (currentSizePixelsRef.current !== undefined) {
      const pixels = currentSizePixelsRef.current;
      panelElement.style.minWidth = `${pixels}px`;
      panelElement.style.maxWidth = `${pixels}px`;
      panelElement.style.width = `${pixels}px`;
      panelElement.style.flexBasis = `${pixels}px`;
      panelElement.style.flexGrow = "0";
      panelElement.style.flexShrink = "0";
    }
    // Run once on mount (empty deps)
  }, []);

  // Set up ResizeObserver to maintain pixel size on panel group resize.
  // Also syncs library percentage state when panelGroup first becomes available.
  useLayoutEffect(() => {
    if (!panelGroup || !panelRef.current) return;

    const panelGroupElement = panelGroup.getElement();
    if (!panelGroupElement) return;

    // Get panel element and apply CSS override
    const panelElement = panelRef.current.getElement();
    if (!panelElement) return;

    panelElementRef.current = panelElement;

    // Apply CSS to lock the panel to pixel width and prevent stretching
    const applyPixelWidth = (pixels: number) => {
      // Use min/max width to clamp the size - this overrides flex behavior
      panelElement.style.minWidth = `${pixels}px`;
      panelElement.style.maxWidth = `${pixels}px`;
      panelElement.style.width = `${pixels}px`;
      panelElement.style.flexBasis = `${pixels}px`;
      panelElement.style.flexGrow = "0";
      panelElement.style.flexShrink = "0";
    };

    // Set initial width if we have a default size
    if (currentSizePixelsRef.current !== undefined) {
      applyPixelWidth(currentSizePixelsRef.current);
    }

    // Initialize panel group size
    const initialSize = panelGroupElement.getBoundingClientRect().width;
    setPanelGroupSize(initialSize);

    // Sync the library's internal percentage state now that panelGroup is available.
    // This must be deferred because the panel library hasn't committed its internal
    // layout state yet during this layout effect — calling resize() synchronously
    // triggers "Previous layout not found". requestAnimationFrame runs after all
    // layout effects but before paint, giving the library time to initialize.
    let rafId: number | null = null;
    if (currentSizePixelsRef.current !== undefined && initialSize > 0) {
      const targetPixels = currentSizePixelsRef.current;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!panelRef.current) return;
        isResizingFromObserverRef.current = true;
        panelRef.current.resize(pixelsToPercentage(targetPixels, initialSize));
        isResizingFromObserverRef.current = false;
        // Initialization complete — allow handleResize to track pixel values
        isSyncingRef.current = false;
      });
    } else {
      // No deferred resize needed — clear the guard immediately
      isSyncingRef.current = false;
    }

    let lastProcessedSize = initialSize;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!panelRef.current || !panelElement || currentSizePixelsRef.current === undefined) return;

      // Get the latest size from entries (most accurate)
      const entry = entries[entries.length - 1];
      const newGroupSize = entry?.contentRect.width ?? panelGroupElement.getBoundingClientRect().width;

      // Only respond to significant size changes (avoid floating point issues)
      if (Math.abs(newGroupSize - lastProcessedSize) < 1) return;

      lastProcessedSize = newGroupSize;

      // Set flag to prevent updating pixel size during this resize
      isResizingFromObserverRef.current = true;

      // Keep the pixel width locked - don't let it stretch
      applyPixelWidth(currentSizePixelsRef.current);

      // Update panel group size state FIRST so constraints are correct
      flushSync(() => setPanelGroupSize(newGroupSize));

      // Then maintain the pixel size by resizing to the new percentage (for library state)
      panelRef.current.resize(pixelsToPercentage(currentSizePixelsRef.current, newGroupSize));

      isResizingFromObserverRef.current = false;
    });

    resizeObserver.observe(panelGroupElement);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      isSyncingRef.current = true; // Re-arm guard for next panelGroup transition
      resizeObserver.disconnect();
      panelElementRef.current = null;
    };
  }, [panelGroup]);

  return (
    <Panel
      ref={combinedPanelRef}
      data-slot="resizable-panel"
      defaultSize={defaultSize}
      maxSize={maxSize}
      minSize={minSize}
      onResize={handleResize}
      {...props}
    />
  );
}
