import { cn } from "@/lib/utils";
import type { TabCycleOverlayPayload } from "~/types/tabs";
import { useEffect, useRef } from "react";

type TabCycleOverlayProps = {
  overlay: TabCycleOverlayPayload;
};

const THUMB_W = 200;
const THUMB_H = 125;

function isControlKeyRelease(e: KeyboardEvent): boolean {
  return (
    e.key === "Control" ||
    e.key === "ControlLeft" ||
    e.key === "ControlRight" ||
    e.code === "ControlLeft" ||
    e.code === "ControlRight"
  );
}

/**
 * Listens on the portal `window` (via a node in the portal tree: `ref.current.ownerDocument.defaultView`)
 * so Control keyup is visible — `before-input-event` on the tab does not fire while the portal has focus.
 */
export function TabCycleOverlay({ overlay }: TabCycleOverlayProps) {
  const { tabs, cycleIndex } = overlay;
  const selectedIndex = ((cycleIndex % tabs.length) + tabs.length) % tabs.length;
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = rootRef.current;
    const portalWindow = el?.ownerDocument?.defaultView;
    if (!portalWindow) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key !== "Tab" || !e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      e.stopPropagation();
      void flow.tabs.tabCyclePortalStep(e.shiftKey);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!isControlKeyRelease(e)) return;
      e.preventDefault();
      e.stopPropagation();
      void flow.tabs.tabCyclePortalControlReleased();
    };

    portalWindow.addEventListener("keydown", onKeyDown, true);
    portalWindow.addEventListener("keyup", onKeyUp, true);

    return () => {
      portalWindow.removeEventListener("keydown", onKeyDown, true);
      portalWindow.removeEventListener("keyup", onKeyUp, true);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      className="flex h-full w-full items-center justify-center bg-black/45 backdrop-blur-[2px] outline-none"
      aria-hidden
    >
      <div
        className={cn(
          "pointer-events-none max-w-[min(96vw,1200px)] rounded-3xl border border-white/12",
          "bg-zinc-900/85 px-6 py-5 shadow-2xl shadow-black/50"
        )}
      >
        <div className="flex flex-row items-end justify-center gap-3 overflow-x-auto pb-1">
          {tabs.map((tab, index) => {
            const selected = index === selectedIndex;
            return (
              <div
                key={tab.tabId}
                className={cn(
                  "flex min-w-0 shrink-0 flex-col items-stretch gap-2 rounded-2xl p-2.5 transition-colors duration-150",
                  selected
                    ? "bg-violet-600/35 ring-2 ring-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.45)]"
                    : "bg-transparent"
                )}
                style={{ width: THUMB_W }}
              >
                <div
                  className="relative w-full overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-white/10"
                  style={{ aspectRatio: `${THUMB_W} / ${THUMB_H}` }}
                >
                  {tab.snapshotUrl ? (
                    <img
                      src={tab.snapshotUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-top"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/90">
                      <span className="text-[11px] text-zinc-500">No preview</span>
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 items-center gap-1.5 px-0.5">
                  {tab.faviconURL ? (
                    <img src={tab.faviconURL} alt="" className="size-4 shrink-0 rounded-sm" draggable={false} />
                  ) : (
                    <span className="size-4 shrink-0 rounded-sm bg-zinc-700/80" />
                  )}
                  <span
                    className={cn(
                      "min-w-0 truncate text-[12px] leading-tight",
                      selected ? "text-white" : "text-zinc-300"
                    )}
                    title={tab.title}
                  >
                    {tab.title || "Untitled"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
