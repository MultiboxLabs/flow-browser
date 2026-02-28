import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, X } from "lucide-react";

export function FindInPage() {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [activeMatch, setActiveMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const close = useCallback(() => {
    setVisible(false);
    setQuery("");
    setActiveMatch(0);
    setTotalMatches(0);
    flow.findInPage.stop("clearSelection");
  }, []);

  const findNext = useCallback(() => {
    const currentQuery = queryRef.current;
    if (!currentQuery) return;
    flow.findInPage.find(currentQuery, { forward: true, findNext: true }).then((result) => {
      if (result) {
        setActiveMatch(result.activeMatchOrdinal);
        setTotalMatches(result.matches);
      }
    });
  }, []);

  const findPrevious = useCallback(() => {
    const currentQuery = queryRef.current;
    if (!currentQuery) return;
    flow.findInPage.find(currentQuery, { forward: false, findNext: true }).then((result) => {
      if (result) {
        setActiveMatch(result.activeMatchOrdinal);
        setTotalMatches(result.matches);
      }
    });
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (!value) {
      setActiveMatch(0);
      setTotalMatches(0);
      flow.findInPage.stop("clearSelection");
      return;
    }

    flow.findInPage.find(value, { forward: true, findNext: false }).then((result) => {
      if (result) {
        setActiveMatch(result.activeMatchOrdinal);
        setTotalMatches(result.matches);
      } else {
        setActiveMatch(0);
        setTotalMatches(0);
      }
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      } else if (e.key === "Enter") {
        if (e.shiftKey) {
          findPrevious();
        } else {
          findNext();
        }
      }
    },
    [close, findNext, findPrevious]
  );

  useEffect(() => {
    const unsubscribe = flow.findInPage.onToggle(() => {
      setVisible((prev) => {
        if (prev) {
          flow.findInPage.stop("clearSelection");
          setQuery("");
          setActiveMatch(0);
          setTotalMatches(0);
          return false;
        }
        return true;
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            "absolute top-1 right-4 z-50",
            "flex items-center gap-1 px-3 py-1.5",
            "bg-neutral-900/95 backdrop-blur-md",
            "border border-white/10 rounded-lg",
            "shadow-lg shadow-black/30"
          )}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
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
            onClick={findPrevious}
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
            onClick={findNext}
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
            onClick={close}
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
      )}
    </AnimatePresence>
  );
}
