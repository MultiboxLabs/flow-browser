import { memo, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { PortalComponent } from "@/components/portal/portal";
import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { useFocusedTabId } from "@/components/providers/tabs-provider";
import { ViewLayer } from "~/layers";

const FIND_BAR_WIDTH = 380;
const FIND_BAR_HEIGHT = 44;
const FIND_BAR_PADDING = 8;

function FindInPageBar({
  onQueryChange,
  onFindNext,
  onFindPrevious,
  onClose,
  query,
  activeMatch,
  totalMatches
}: {
  onQueryChange: (value: string) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onClose: () => void;
  query: string;
  activeMatch: number;
  totalMatches: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const win = el.ownerDocument.defaultView ?? window;
    let inner: number;
    const outer = win.requestAnimationFrame(() => {
      inner = win.requestAnimationFrame(() => {
        el.focus();
      });
    });
    return () => {
      win.cancelAnimationFrame(outer);
      if (inner !== undefined) win.cancelAnimationFrame(inner);
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter") {
        if (e.shiftKey) {
          onFindPrevious();
        } else {
          onFindNext();
        }
      }
    },
    [onClose, onFindNext, onFindPrevious]
  );

  return (
    <motion.div
      className={cn(
        "w-full h-full",
        "flex items-center gap-1 px-3 py-1.5",
        "bg-neutral-900/95 backdrop-blur-md",
        "border border-white/10 rounded-lg",
        "shadow-lg shadow-black/30"
      )}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in page"
        className={cn(
          "w-48 h-7 px-2 text-sm",
          "bg-white/10 text-white placeholder-white/40",
          "border border-white/10 rounded-md",
          "outline-none focus:border-white/25",
          "transition-colors duration-150"
        )}
      />

      <span className="text-xs text-white/50 min-w-[4rem] text-center select-none tabular-nums">
        {query ? `${activeMatch} / ${totalMatches}` : ""}
      </span>

      <button
        onClick={onFindPrevious}
        disabled={!query || totalMatches === 0}
        className={cn(
          "p-1 rounded-md text-white/70",
          "hover:bg-white/10 hover:text-white",
          "disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/70",
          "transition-colors duration-150"
        )}
        title="Previous match (Shift+Enter)"
      >
        <ChevronUp size={16} />
      </button>

      <button
        onClick={onFindNext}
        disabled={!query || totalMatches === 0}
        className={cn(
          "p-1 rounded-md text-white/70",
          "hover:bg-white/10 hover:text-white",
          "disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/70",
          "transition-colors duration-150"
        )}
        title="Next match (Enter)"
      >
        <ChevronDown size={16} />
      </button>

      <button
        onClick={onClose}
        className={cn(
          "p-1 rounded-md text-white/70",
          "hover:bg-white/10 hover:text-white",
          "transition-colors duration-150"
        )}
        title="Close (Esc)"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

/**
 * One instance per tab that has find-in-page open. Each owns its own
 * query / match state. The portal is only visible when isFocused.
 */
const TabFindInPage = memo(function TabFindInPage({
  tabId,
  isFocused,
  portalStyle,
  onClose
}: {
  tabId: number;
  isFocused: boolean;
  portalStyle: React.CSSProperties;
  onClose: (tabId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeMatch, setActiveMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const queryRef = useRef(query);
  queryRef.current = query;

  // Only listen for results while this tab is focused
  useEffect(() => {
    if (!isFocused) return;
    return flow.findInPage.onResult((result) => {
      setActiveMatch(result.activeMatchOrdinal);
      setTotalMatches(result.matches);
    });
  }, [isFocused]);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);

      if (!value) {
        setActiveMatch(0);
        setTotalMatches(0);
        if (isFocused) flow.findInPage.stop("clearSelection");
        return;
      }

      if (isFocused) {
        flow.findInPage.find(value, { forward: true, findNext: true });
      }
    },
    [isFocused]
  );

  const handleFindNext = useCallback(() => {
    if (!queryRef.current || !isFocused) return;
    flow.findInPage.find(queryRef.current, { forward: true, findNext: false });
  }, [isFocused]);

  const handleFindPrevious = useCallback(() => {
    if (!queryRef.current || !isFocused) return;
    flow.findInPage.find(queryRef.current, { forward: false, findNext: false });
  }, [isFocused]);

  const handleClose = useCallback(() => {
    onClose(tabId);
  }, [onClose, tabId]);

  return (
    <PortalComponent
      visible={isFocused}
      autoFocus={isFocused}
      zIndex={ViewLayer.OVERLAY}
      className="fixed"
      style={portalStyle}
    >
      <AnimatePresence>
        {isFocused && (
          <FindInPageBar
            query={query}
            activeMatch={activeMatch}
            totalMatches={totalMatches}
            onQueryChange={handleQueryChange}
            onFindNext={handleFindNext}
            onFindPrevious={handleFindPrevious}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </PortalComponent>
  );
});

/**
 * Top-level orchestrator. Manages which tabs have find bars open and
 * renders one TabFindInPage per open tab.
 */
export function FindInPage() {
  const focusedTabId = useFocusedTabId();
  const [openTabIds, setOpenTabIds] = useState<number[]>([]);
  const focusedTabIdRef = useRef(focusedTabId);
  focusedTabIdRef.current = focusedTabId;

  const anchorRef = useRef<HTMLDivElement>(null);
  const anchorRect = useBoundingRect(anchorRef);

  useEffect(() => {
    return flow.findInPage.onToggle(() => {
      const tabId = focusedTabIdRef.current;
      if (tabId === null) return;

      setOpenTabIds((prev) => {
        if (prev.includes(tabId)) {
          flow.findInPage.stop("keepSelection");
          return prev.filter((id) => id !== tabId);
        }
        return [...prev, tabId];
      });
    });
  }, []);

  const handleClose = useCallback((tabId: number) => {
    if (tabId === focusedTabIdRef.current) {
      flow.findInPage.stop("keepSelection");
    }
    setOpenTabIds((prev) => prev.filter((id) => id !== tabId));
  }, []);

  const portalStyle: React.CSSProperties = anchorRect
    ? {
        top: anchorRect.y + FIND_BAR_PADDING,
        right: window.innerWidth - anchorRect.right + FIND_BAR_PADDING,
        width: FIND_BAR_WIDTH,
        height: FIND_BAR_HEIGHT
      }
    : { top: 0, right: 0, width: FIND_BAR_WIDTH, height: FIND_BAR_HEIGHT };

  return (
    <>
      <div ref={anchorRef} className="absolute inset-0 pointer-events-none" />
      {openTabIds.map((tabId) => (
        <TabFindInPage
          key={tabId}
          tabId={tabId}
          isFocused={tabId === focusedTabId}
          portalStyle={portalStyle}
          onClose={handleClose}
        />
      ))}
    </>
  );
}
