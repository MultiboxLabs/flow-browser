import { useCallback, useEffect, useRef, useState } from "react";
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

interface PerTabFindState {
  query: string;
  activeMatch: number;
  totalMatches: number;
}

function FindInPageBar({
  query,
  activeMatch,
  totalMatches,
  onQueryChange,
  onFindNext,
  onFindPrevious,
  onClose
}: {
  query: string;
  activeMatch: number;
  totalMatches: number;
  onQueryChange: (value: string) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onClose: () => void;
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

const DEFAULT_FIND_STATE: PerTabFindState = { query: "", activeMatch: 0, totalMatches: 0 };

export function FindInPage() {
  const focusedTabId = useFocusedTabId();

  // Per-tab state stored in refs to avoid re-renders on tab switch
  const perTabStateRef = useRef(new Map<number, PerTabFindState>());
  const openTabsRef = useRef(new Set<number>());

  // Reactive state for the currently displayed find bar
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [activeMatch, setActiveMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  const focusedTabIdRef = useRef(focusedTabId);

  // Anchor for content area positioning
  const anchorRef = useRef<HTMLDivElement>(null);
  const anchorRect = useBoundingRect(anchorRef);

  // Load state for a given tab ID into reactive state
  const loadTabState = useCallback((tabId: number | null) => {
    if (tabId === null || !openTabsRef.current.has(tabId)) {
      setVisible(false);
      return;
    }

    const state = perTabStateRef.current.get(tabId) ?? DEFAULT_FIND_STATE;
    setVisible(true);
    setQuery(state.query);
    setActiveMatch(state.activeMatch);
    setTotalMatches(state.totalMatches);

    // Re-trigger the search to restore highlights on the newly focused tab
    if (state.query) {
      flow.findInPage.find(state.query, { forward: true, findNext: true });
    }
  }, []);

  // Handle focused tab changes
  useEffect(() => {
    const prevTabId = focusedTabIdRef.current;
    focusedTabIdRef.current = focusedTabId;

    if (prevTabId === focusedTabId) return;

    // Save state for the tab we're leaving
    if (prevTabId !== null && openTabsRef.current.has(prevTabId)) {
      // State is saved via the ref-captured values in saveCurrentTabState,
      // but since this effect runs after render with stale closure values,
      // we read from the DOM-consistent refs instead.
      // The latest query/match state was already saved by the handlers below.
    }

    // Stop any active search (operates on the new focused tab, but
    // the old tab's highlights are hidden with its WebContentsView)
    flow.findInPage.stop("keepSelection");

    // Load state for the new tab
    loadTabState(focusedTabId);
  }, [focusedTabId, loadTabState]);

  // Listen for streaming results from the main process
  useEffect(() => {
    const unsubscribe = flow.findInPage.onResult((result) => {
      setActiveMatch(result.activeMatchOrdinal);
      setTotalMatches(result.matches);

      // Keep per-tab state in sync
      const tabId = focusedTabIdRef.current;
      if (tabId !== null && openTabsRef.current.has(tabId)) {
        const state = perTabStateRef.current.get(tabId);
        if (state) {
          state.activeMatch = result.activeMatchOrdinal;
          state.totalMatches = result.matches;
        }
      }
    });
    return unsubscribe;
  }, []);

  // Listen for Ctrl+F toggle
  useEffect(() => {
    const unsubscribe = flow.findInPage.onToggle(() => {
      const tabId = focusedTabIdRef.current;
      if (tabId === null) return;

      if (openTabsRef.current.has(tabId)) {
        // Close for this tab
        openTabsRef.current.delete(tabId);
        perTabStateRef.current.delete(tabId);
        flow.findInPage.stop("keepSelection");
        setVisible(false);
        setQuery("");
        setActiveMatch(0);
        setTotalMatches(0);
      } else {
        // Open for this tab
        openTabsRef.current.add(tabId);
        perTabStateRef.current.set(tabId, { ...DEFAULT_FIND_STATE });
        setVisible(true);
        setQuery("");
        setActiveMatch(0);
        setTotalMatches(0);
      }
    });
    return unsubscribe;
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);

    const tabId = focusedTabIdRef.current;
    if (tabId !== null) {
      const state = perTabStateRef.current.get(tabId);
      if (state) state.query = value;
    }

    if (!value) {
      setActiveMatch(0);
      setTotalMatches(0);
      flow.findInPage.stop("clearSelection");
      return;
    }

    flow.findInPage.find(value, { forward: true, findNext: true });
  }, []);

  const handleFindNext = useCallback(() => {
    if (!query) return;
    flow.findInPage.find(query, { forward: true, findNext: false });
  }, [query]);

  const handleFindPrevious = useCallback(() => {
    if (!query) return;
    flow.findInPage.find(query, { forward: false, findNext: false });
  }, [query]);

  const handleClose = useCallback(() => {
    const tabId = focusedTabIdRef.current;
    if (tabId !== null) {
      openTabsRef.current.delete(tabId);
      perTabStateRef.current.delete(tabId);
    }
    flow.findInPage.stop("keepSelection");
    setVisible(false);
    setQuery("");
    setActiveMatch(0);
    setTotalMatches(0);
  }, []);

  // Stop search on unmount
  useEffect(() => {
    return () => {
      flow.findInPage.stop("keepSelection");
    };
  }, []);

  const portalStyle = anchorRect
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
      <PortalComponent
        visible={visible}
        autoFocus={visible}
        zIndex={ViewLayer.OVERLAY}
        className="fixed"
        style={portalStyle}
      >
        <AnimatePresence>
          {visible && (
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
    </>
  );
}
