import { cn } from "@/lib/utils";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type HTMLAttributes } from "react";

export type UsePopoverListboxOptions = {
  open: boolean;
  itemCount: number;
  ariaLabel: string;
  getOptionId: (index: number) => string;
  onActivate: (index: number) => void;
  /** When true, ArrowDown from last item wraps to first (and vice versa). Default true. */
  wrap?: boolean;
  /** Highlighted row when the list opens. Clamped to `itemCount - 1`. Default 0. */
  initialHighlightedIndex?: number;
};

export type PopoverListboxOptionProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  "id" | "role" | "aria-selected" | "onMouseEnter"
>;

export type PopoverListbox = ReturnType<typeof usePopoverListbox>;

const defaultListClassName =
  "max-h-64 custom-scrollbar overflow-y-auto rounded-sm outline-none focus:outline-none focus-visible:outline-none";

type PopoverListboxContextType = {
  highlightedIndex: number;
  getOptionProps: (index: number) => PopoverListboxOptionProps;
  onActivate: (index: number) => void;
};

const PopoverListboxContext = createContext<PopoverListboxContextType | undefined>(undefined);

function usePopoverListboxContext() {
  const ctx = useContext(PopoverListboxContext);
  if (!ctx) throw new Error("PopoverListboxItem must be used within a PopoverListboxList");
  return ctx;
}

export function usePopoverListbox({
  open,
  itemCount,
  ariaLabel,
  getOptionId,
  onActivate,
  wrap = true,
  initialHighlightedIndex = 0
}: UsePopoverListboxOptions) {
  const listRef = useRef<HTMLDivElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const itemCountRef = useRef(itemCount);
  itemCountRef.current = itemCount;
  const highlightedIndexRef = useRef(highlightedIndex);
  highlightedIndexRef.current = highlightedIndex;
  const getOptionIdRef = useRef(getOptionId);
  getOptionIdRef.current = getOptionId;
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const n = itemCount;
      const i = n <= 0 ? 0 : Math.min(Math.max(0, initialHighlightedIndex), n - 1);
      setHighlightedIndex(i);
    }
    wasOpenRef.current = open;
  }, [open, itemCount, initialHighlightedIndex]);

  useEffect(() => {
    if (!open) return;
    setHighlightedIndex((i) => Math.min(i, Math.max(0, itemCount - 1)));
  }, [itemCount, open]);

  useEffect(() => {
    if (!open || itemCount === 0 || highlightedIndex < 0 || highlightedIndex >= itemCount) return;
    const id = getOptionIdRef.current(highlightedIndex);
    const root = listRef.current?.ownerDocument ?? document;
    root.getElementById(id)?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, itemCount, open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    const doc = el.ownerDocument;

    el.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      const n = itemCountRef.current;
      if (n === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (wrap) {
          setHighlightedIndex((i) => (i + 1) % n);
        } else {
          setHighlightedIndex((i) => Math.min(n - 1, i + 1));
        }
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (wrap) {
          setHighlightedIndex((i) => (i - 1 + n) % n);
        } else {
          setHighlightedIndex((i) => Math.max(0, i - 1));
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const i = highlightedIndexRef.current;
        if (i >= 0 && i < itemCountRef.current) {
          onActivateRef.current(i);
        }
      }
    };

    doc.addEventListener("keydown", onKeyDown);
    return () => doc.removeEventListener("keydown", onKeyDown);
  }, [open, wrap]);

  const activeDescendant =
    itemCount > 0 && highlightedIndex >= 0 && highlightedIndex < itemCount ? getOptionId(highlightedIndex) : undefined;

  const listProps: HTMLAttributes<HTMLDivElement> = {
    role: "listbox",
    tabIndex: -1,
    "aria-label": ariaLabel,
    "aria-activedescendant": activeDescendant,
    className: defaultListClassName
  };

  const getOptionProps = useCallback(
    (index: number): PopoverListboxOptionProps => ({
      id: getOptionId(index),
      role: "option",
      "aria-selected": index === highlightedIndex,
      onMouseEnter: () => setHighlightedIndex(index)
    }),
    [getOptionId, highlightedIndex]
  );

  const contentProps = {
    onOpenAutoFocus: (event: Event) => event.preventDefault()
  };

  return {
    listRef,
    listProps,
    highlightedIndex,
    getOptionProps,
    onActivate,
    contentProps
  };
}

export function PopoverListboxList({
  listbox,
  className,
  children
}: {
  listbox: PopoverListbox;
  className?: string;
  children: React.ReactNode;
}) {
  const { listRef, listProps, highlightedIndex, getOptionProps, onActivate } = listbox;
  const { className: listClassName, ...rest } = listProps;
  return (
    <PopoverListboxContext.Provider value={{ highlightedIndex, getOptionProps, onActivate }}>
      <div ref={listRef} {...rest} className={cn(listClassName, className)}>
        {children}
      </div>
    </PopoverListboxContext.Provider>
  );
}

export function PopoverListboxItem({
  index,
  className,
  children
}: {
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  const { highlightedIndex, getOptionProps, onActivate } = usePopoverListboxContext();
  return (
    <div
      {...getOptionProps(index)}
      onClick={() => onActivate(index)}
      className={cn(
        "flex min-w-0 w-full items-center gap-2 truncate px-2 py-1.5 text-sm rounded-sm",
        index === highlightedIndex ? "bg-accent" : "hover:bg-accent",
        className
      )}
    >
      {children}
    </div>
  );
}
