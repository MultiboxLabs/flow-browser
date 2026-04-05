import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { KeyRound, User, X } from "lucide-react";
import { PortalComponent } from "@/components/portal/portal";
import { useFocusedTabId, useTabs } from "@/components/providers/tabs-provider";
import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { cn } from "@/lib/utils";
import { ViewLayer } from "~/layers";

const PASSKEY_PANEL_WIDTH = 320;
const PASSKEY_PANEL_PADDING = 8;

// Height calculation constants
const PANEL_PADDING = 8 * 2; // p-2
const PANEL_GAP = 8; // gap-2
const HEADER_HEIGHT = 28;
const CONTENT_HEIGHT = 18; // subtitle text-xs
const PERMISSION_CONTENT_HEIGHT = 40; // permission text text-sm (can wrap)
const PASSKEY_ITEM_HEIGHT = 44;
const PASSKEY_LIST_GAP = 4; // gap-1
const PANEL_BUFFER = 8; // extra space for rounded corners
const PERMISSION_BUTTON_HEIGHT = 32;

function calculatePanelHeight(passkeyCount: number) {
  const listHeight = passkeyCount * PASSKEY_ITEM_HEIGHT + (passkeyCount - 1) * PASSKEY_LIST_GAP;
  return PANEL_PADDING + HEADER_HEIGHT + PANEL_GAP + CONTENT_HEIGHT + PANEL_GAP + listHeight + PANEL_BUFFER;
}

function calculatePermissionPanelHeight() {
  return PANEL_PADDING + HEADER_HEIGHT + PANEL_GAP + PERMISSION_CONTENT_HEIGHT + PANEL_GAP + PERMISSION_BUTTON_HEIGHT;
}

const MOCK_PASSKEYS = [
  {
    id: "pk-1",
    rpName: "webauthn.io",
    username: "eviebreezy"
  },
  {
    id: "pk-2",
    rpName: "webauthn.io",
    username: "evan@flow.local"
  }
] as const;

interface PasskeyConditionalUIProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function getRelyingPartyLabel(url: string | undefined) {
  if (!url) return MOCK_PASSKEYS[0].rpName;

  try {
    return new URL(url).hostname.replace(/^www\./, "") || MOCK_PASSKEYS[0].rpName;
  } catch {
    return MOCK_PASSKEYS[0].rpName;
  }
}

/* ---------------------------------- Shared Components ---------------------------------- */

function PanelContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className={cn(
        "w-full h-full",
        "flex flex-col gap-2 p-2",
        "bg-neutral-900/95 backdrop-blur-md",
        "border border-white/10 rounded-lg"
      )}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function PanelHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <div className="flex items-center gap-2">
        <KeyRound className="size-4 text-white/70" />
        <span className="text-sm font-medium text-white">Passkey sign-in</span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close passkey prompt"
        className={cn(
          "p-1 rounded-md text-white/70",
          "hover:bg-white/10 hover:text-white",
          "transition-colors duration-150"
        )}
      >
        <X size={16} />
      </button>
    </div>
  );
}

/* ---------------------------------- Permission Content ---------------------------------- */

function PermissionContent({ onAllow }: { onAllow: () => void }) {
  return (
    <>
      <p className="px-1 text-sm text-white/70">Flow needs permission to access and use your passkeys.</p>
      <button
        type="button"
        onClick={onAllow}
        className={cn(
          "w-full px-3 py-1.5 rounded-md text-sm font-medium",
          "bg-white/10 text-white border border-white/10",
          "hover:bg-white/15",
          "transition-colors duration-150"
        )}
      >
        Grant Permission
      </button>
    </>
  );
}

/* ---------------------------------- Passkey List Content ---------------------------------- */

function PasskeyListContent({
  relyingPartyLabel,
  passkeys
}: {
  relyingPartyLabel: string;
  passkeys: typeof MOCK_PASSKEYS;
}) {
  return (
    <>
      <p className="px-1 text-xs text-white/50">
        Choose a passkey for <span className="text-white/70">{relyingPartyLabel}</span>
      </p>
      <div className="flex flex-col gap-1">
        {passkeys.map((passkey) => (
          <button
            key={passkey.id}
            type="button"
            className={cn(
              "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left",
              "hover:bg-white/10",
              "transition-colors duration-150"
            )}
          >
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md",
                "bg-white/10 border border-white/10"
              )}
            >
              <User className="size-4 text-white/70" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-white">{relyingPartyLabel}</span>
              <span className="block truncate text-xs text-white/50">{passkey.username}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------------------------------- Types ---------------------------------- */

type PanelState = "permission" | "list";

/* ---------------------------------- Main Component ---------------------------------- */

export function PasskeyConditionalUI({ anchorRef }: PasskeyConditionalUIProps) {
  const focusedTabId = useFocusedTabId();
  const { tabsData } = useTabs();
  const [openTabIds, setOpenTabIds] = useState<number[]>([]);
  const [closingTabIds, setClosingTabIds] = useState<number[]>([]);
  const [panelStates, setPanelStates] = useState<Record<number, PanelState>>({});
  const openTabIdsRef = useRef(openTabIds);
  openTabIdsRef.current = openTabIds;
  const focusedTabIdRef = useRef(focusedTabId);
  focusedTabIdRef.current = focusedTabId;
  const anchorRect = useBoundingRect(anchorRef);

  useEffect(() => {
    const tabId = focusedTabIdRef.current;
    if (tabId === null) return;
    if (openTabIdsRef.current.includes(tabId)) return;
    setOpenTabIds((prev) => [...prev, tabId]);
    setPanelStates((prev) => ({ ...prev, [tabId]: "permission" }));
  }, [focusedTabId]);

  useEffect(() => {
    if (!tabsData) return;
    const existingTabIds = new Set(tabsData.tabs.map((tab) => tab.id));
    setOpenTabIds((prev) => {
      const next = prev.filter((tabId) => existingTabIds.has(tabId));
      return next.length === prev.length ? prev : next;
    });
  }, [tabsData]);

  const handleClose = (tabId: number) => {
    // Start closing animation
    setClosingTabIds((prev) => [...prev, tabId]);
  };

  const handleAnimationComplete = (tabId: number) => {
    // Remove from lists after animation completes
    setOpenTabIds((prev) => prev.filter((id) => id !== tabId));
    setClosingTabIds((prev) => prev.filter((id) => id !== tabId));
    setPanelStates((prev) => {
      const next = { ...prev };
      delete next[tabId];
      return next;
    });
  };

  const handleStateChange = (tabId: number, state: PanelState) => {
    setPanelStates((prev) => ({ ...prev, [tabId]: state }));
  };

  if (!anchorRect) return null;

  return (
    <>
      {openTabIds.map((tabId) => {
        const tab = tabsData?.tabs.find((entry) => entry.id === tabId);
        const relyingPartyLabel = getRelyingPartyLabel(tab?.url);
        const panelState = panelStates[tabId] ?? "permission";
        const isClosing = closingTabIds.includes(tabId);

        const portalStyle: React.CSSProperties = {
          top: anchorRect.y + PASSKEY_PANEL_PADDING,
          right: window.innerWidth - anchorRect.right + PASSKEY_PANEL_PADDING,
          width: PASSKEY_PANEL_WIDTH,
          height:
            panelState === "permission" ? calculatePermissionPanelHeight() : calculatePanelHeight(MOCK_PASSKEYS.length)
        };

        return (
          <PortalComponent
            key={tabId}
            visible={tabId === focusedTabId}
            zIndex={ViewLayer.OVERLAY}
            className="fixed"
            style={portalStyle}
          >
            <PasskeyConditionalPanelWithState
              relyingPartyLabel={relyingPartyLabel}
              panelState={panelState}
              isVisible={!isClosing}
              onClose={() => handleClose(tabId)}
              onStateChange={(state) => handleStateChange(tabId, state)}
              onAnimationComplete={() => handleAnimationComplete(tabId)}
            />
          </PortalComponent>
        );
      })}
    </>
  );
}

function PasskeyConditionalPanelWithState({
  relyingPartyLabel,
  panelState,
  isVisible,
  onClose,
  onStateChange,
  onAnimationComplete
}: {
  relyingPartyLabel: string;
  panelState: PanelState;
  isVisible: boolean;
  onClose: () => void;
  onStateChange: (state: PanelState) => void;
  onAnimationComplete: () => void;
}) {
  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && (
        <PanelContainer>
          <PanelHeader onClose={onClose} />
          {panelState === "permission" ? (
            <PermissionContent onAllow={() => onStateChange("list")} />
          ) : (
            <PasskeyListContent relyingPartyLabel={relyingPartyLabel} passkeys={MOCK_PASSKEYS} />
          )}
        </PanelContainer>
      )}
    </AnimatePresence>
  );
}
