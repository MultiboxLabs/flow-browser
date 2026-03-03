import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { KeyRound, X } from "lucide-react";
import { PortalComponent } from "@/components/portal/portal";
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
        isSelected ? "bg-white/15" : "hover:bg-white/10"
      )}
      onClick={() => onSelect(passkey.id)}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
        <KeyRound size={16} className="text-white/70" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-sm text-white truncate">{passkey.userName}</span>
        <span className="text-xs text-white/40 truncate">{passkey.rpId}</span>
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % passkeys.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + passkeys.length) % passkeys.length);
          break;
        case "Enter":
          e.preventDefault();
          if (passkeys[selectedIndex]) {
            onSelect(passkeys[selectedIndex].id);
          }
          break;
        case "Escape":
          e.preventDefault();
          onDismiss();
          break;
      }
    },
    [passkeys, selectedIndex, onSelect, onDismiss]
  );

  useEffect(() => {
    const el = containerRef.current;
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

  return (
    <motion.div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-full overflow-hidden outline-none",
        "bg-neutral-900/95 backdrop-blur-md",
        "border border-white/10 rounded-lg",
        "shadow-lg shadow-black/30"
      )}
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.12, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs text-white/50 font-medium select-none">Sign in with a passkey</span>
        <button
          onClick={onDismiss}
          className={cn(
            "p-0.5 rounded text-white/40",
            "hover:bg-white/10 hover:text-white/70",
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

  useEffect(() => {
    return flow.passkeyOverlay.onShow((data) => {
      setPasskeys(data.passkeys);
      setPosition(data.position);
      setVisible(true);
    });
  }, []);

  useEffect(() => {
    return flow.passkeyOverlay.onHide(() => {
      setVisible(false);
    });
  }, []);

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
    <PortalComponent
      visible={visible}
      autoFocus={visible}
      zIndex={ViewLayer.OVERLAY}
      className="fixed"
      style={portalStyle}
    >
      <AnimatePresence>
        {visible && passkeys.length > 0 && (
          <PasskeyDropdown passkeys={passkeys} onSelect={handleSelect} onDismiss={handleDismiss} />
        )}
      </AnimatePresence>
    </PortalComponent>
  );
}
