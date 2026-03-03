import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { KeyRound, X } from "lucide-react";
import { PortalComponent } from "@/components/portal/portal";
import { useFocusedTabId } from "@/components/providers/tabs-provider";
import { useSpaces } from "@/components/providers/spaces-provider";
import { ViewLayer } from "~/layers";
import type { PasskeyCredentialInfo, PasskeyOverlayPosition } from "~/flow/interfaces/browser/passkey-overlay";

function PasskeyItem({
  passkey,
  isSelected,
  onSelect,
  onMouseEnter
}: {
  passkey: PasskeyCredentialInfo;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5",
        "text-left transition-colors duration-100",
        isSelected ? "bg-black/10 dark:bg-white/15" : "hover:bg-black/5 dark:hover:bg-white/10"
      )}
      onClick={() => onSelect(passkey.id)}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">
        <KeyRound size={16} className="text-black/60 dark:text-white/70" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-black dark:text-white truncate">{passkey.userName}</span>
        <span className="text-xs text-black/40 dark:text-white/40 truncate">{passkey.rpId}</span>
      </div>
    </button>
  );
}

function PasskeyDropdown({
  passkeys,
  onSelect,
  onDismiss
}: {
  passkeys: PasskeyCredentialInfo[];
  onSelect: (id: string) => void;
  onDismiss: () => void;
}) {
  // Start with no selection (-1). Arrow down selects the first item.
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const selectedIndexRef = useRef(selectedIndex);
  selectedIndexRef.current = selectedIndex;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const doc = el.ownerDocument;
    const win = doc.defaultView ?? window;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => {
            if (prev < passkeys.length - 1) return prev + 1;
            return prev;
          });
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => {
            if (prev > 0) return prev - 1;
            return prev;
          });
          break;
        case "Enter": {
          // Only intercept enter if an item is selected
          const idx = selectedIndexRef.current;
          if (idx >= 0 && passkeys[idx]) {
            e.preventDefault();
            onSelect(passkeys[idx].id);
          }
          break;
        }
        case "Escape":
          e.preventDefault();
          onDismiss();
          break;
      }
    };

    win.addEventListener("keydown", handleKeyDown, true);
    return () => {
      win.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [passkeys, onSelect, onDismiss]);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "w-full overflow-hidden outline-none",
        "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md",
        "border border-black/20 dark:border-white/20 rounded-lg",
        "shadow-lg shadow-black/15 dark:shadow-black/30"
      )}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/10 dark:border-white/10">
        <span className="text-xs text-black/50 dark:text-white/50 font-medium select-none">Sign in with a passkey</span>
        <button
          onClick={onDismiss}
          className={cn(
            "p-0.5 rounded text-black/40 dark:text-white/40",
            "hover:bg-black/5 hover:text-black/70 dark:hover:bg-white/10 dark:hover:text-white/70",
            "transition-colors duration-150"
          )}
        >
          <X size={12} />
        </button>
      </div>

      <div className="max-h-[220px] overflow-y-auto">
        {passkeys.map((passkey, index) => (
          <PasskeyItem
            key={passkey.id}
            passkey={passkey}
            isSelected={index === selectedIndex}
            onSelect={onSelect}
            onMouseEnter={() => setSelectedIndex(index)}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function PasskeyOverlay() {
  const [visible, setVisible] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyCredentialInfo[]>([]);
  const [position, setPosition] = useState<PasskeyOverlayPosition>({ x: 0, y: 0, width: 300, height: 200 });
  const [shownForTabId, setShownForTabId] = useState<number | null>(null);
  const focusedTabId = useFocusedTabId();

  useEffect(() => {
    return flow.passkeyOverlay.onShow((data) => {
      setPasskeys(data.passkeys);
      setPosition(data.position);
      setShownForTabId(focusedTabId);
      setVisible(true);
    });
  }, [focusedTabId]);

  useEffect(() => {
    return flow.passkeyOverlay.onHide(() => {
      setVisible(false);
    });
  }, []);

  // Compute effective visibility: hide immediately when tab changes
  const isEffectivelyVisible = visible && shownForTabId !== null && shownForTabId === focusedTabId;

  const { isCurrentSpaceLight } = useSpaces();

  const handleSelect = useCallback((credentialId: string) => {
    flow.passkeyOverlay.select(credentialId);
    setVisible(false);
  }, []);

  const handleDismiss = useCallback(() => {
    flow.passkeyOverlay.dismiss();
    setVisible(false);
  }, []);

  const portalStyle: React.CSSProperties = {
    top: position.y,
    left: position.x,
    width: position.width,
    height: position.height
  };

  return (
    <PortalComponent visible={isEffectivelyVisible} zIndex={ViewLayer.OVERLAY} className="fixed" style={portalStyle}>
      <div className={cn(!isCurrentSpaceLight && "dark")}>
        <AnimatePresence>
          {isEffectivelyVisible && passkeys.length > 0 && (
            <PasskeyDropdown passkeys={passkeys} onSelect={handleSelect} onDismiss={handleDismiss} />
          )}
        </AnimatePresence>
      </div>
    </PortalComponent>
  );
}
