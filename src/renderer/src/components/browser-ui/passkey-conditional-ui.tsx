import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { KeyRound, User, X } from "lucide-react";
import { PortalComponent } from "@/components/portal/portal";
import { useFocusedTabId } from "@/components/providers/tabs-provider";
import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { cn } from "@/lib/utils";
import { ViewLayer } from "~/layers";
import { usePasskeyRequests } from "@/components/providers/passkeys-request-provider";
import type { ConditionalPasskeyRequest, PasskeyCredential } from "~/types/passkey";
import "@/css/conditional-passkey.css";

const PASSKEY_PANEL_WIDTH = 320;
const PASSKEY_PANEL_PADDING = 8;

interface PasskeyConditionalUIProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

/* ---------------------------------- Shared Components ---------------------------------- */

function PanelContainer({ children, onResize }: { children: React.ReactNode; onResize?: (height: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!onResize) {
      return;
    }

    const element = containerRef.current;
    if (!element) {
      return;
    }

    const reportHeight = (entry?: ResizeObserverEntry) => {
      const borderBoxSize = entry?.borderBoxSize;
      const measuredHeight = borderBoxSize?.[0]?.blockSize;

      onResize(Math.ceil(measuredHeight ?? element.getBoundingClientRect().height));
    };

    reportHeight();

    const observer = new ResizeObserver((entries) => {
      reportHeight(entries[0]);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [onResize]);

  return (
    <motion.div
      ref={containerRef}
      className={cn(
        "w-full",
        "flex flex-col gap-2 p-2",
        "bg-neutral-900/95 backdrop-blur-md",
        "border border-white/10 rounded-lg",
        "select-none"
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

/* ---------------------------------- Denied Content ---------------------------------- */

function DeniedContent() {
  return (
    <>
      <p className="px-1 text-sm text-white/70">Passkey access was denied. You can re-enable it in System Settings.</p>
      <button
        type="button"
        onClick={() => flow.passkey.openSystemSettings()}
        className={cn(
          "w-full px-3 py-1.5 rounded-md text-sm font-medium",
          "bg-white/10 text-white border border-white/10",
          "hover:bg-white/15",
          "transition-colors duration-150"
        )}
      >
        Open System Settings
      </button>
    </>
  );
}

/* ---------------------------------- Passkey List Content ---------------------------------- */

function PasskeyListContent({
  relyingPartyLabel,
  passkeys,
  onSelect
}: {
  relyingPartyLabel: string;
  passkeys: PasskeyCredential[];
  onSelect: (passkey: PasskeyCredential) => void;
}) {
  if (passkeys.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-2 py-3 text-center">
        <KeyRound className="size-6 text-white/20" />
        <p className="text-sm text-white/50">No passkeys found</p>
        <p className="text-xs text-white/30">
          No saved passkeys for <span className="text-white/40">{relyingPartyLabel}</span>
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="px-1 text-xs text-white/50">
        Choose a passkey for <span className="text-white/70">{relyingPartyLabel}</span>
      </p>
      {/* (48+4) * 4 = 208px */}
      <div className="flex flex-col gap-1 max-h-[208px] overflow-y-auto passkey-scrollbar">
        {passkeys.map((passkey) => (
          <button
            key={passkey.id}
            type="button"
            onClick={() => onSelect(passkey)}
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
              <span className="block truncate text-xs text-white/50">{passkey.userName}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

/* ---------------------------------- Types ---------------------------------- */

type PanelState = "permission" | "denied" | "list";
type PanelVisibility = "open" | "hidden-by-selection" | "dismissed";

interface ConditionalPasskeyPanel {
  tabId: number;
  request: ConditionalPasskeyRequest;
  phase: PanelState;
  visibility: PanelVisibility;
  isClosing: boolean;
  passkeys: PasskeyCredential[];
  initialized: boolean;
}

function createPanel(request: ConditionalPasskeyRequest): ConditionalPasskeyPanel {
  return {
    tabId: request.tabId as number,
    request,
    phase: "permission",
    visibility: request.state === "processing" ? "hidden-by-selection" : "open",
    isClosing: false,
    passkeys: [],
    initialized: false
  };
}

function syncPanelWithRequest(
  panel: ConditionalPasskeyPanel,
  request: ConditionalPasskeyRequest
): ConditionalPasskeyPanel {
  if (panel.request.operationId !== request.operationId) {
    return createPanel(request);
  }

  if (request.state === "processing") {
    if (panel.visibility === "dismissed") {
      return { ...panel, request };
    }

    return {
      ...panel,
      request,
      visibility: "hidden-by-selection",
      isClosing: panel.visibility === "open" ? true : panel.isClosing
    };
  }

  if (panel.visibility === "dismissed") {
    return {
      ...panel,
      request
    };
  }

  return {
    ...panel,
    request,
    visibility: "open",
    isClosing: false
  };
}

function useConditionalPasskeyPanels(conditionalRequests: ConditionalPasskeyRequest[]) {
  const [panelsByTabId, setPanelsByTabId] = useState<Record<number, ConditionalPasskeyPanel>>({});
  const panelsByTabIdRef = useRef(panelsByTabId);
  panelsByTabIdRef.current = panelsByTabId;

  const activeRequestsByTabIdRef = useRef(new Map<number, ConditionalPasskeyRequest>());

  const isCurrentOperation = useCallback((tabId: number, operationId: string) => {
    return panelsByTabIdRef.current[tabId]?.request.operationId === operationId;
  }, []);

  const updatePanel = useCallback(
    (tabId: number, updater: (panel: ConditionalPasskeyPanel) => ConditionalPasskeyPanel | null) => {
      setPanelsByTabId((prev) => {
        const panel = prev[tabId];
        if (!panel) {
          return prev;
        }

        const nextPanel = updater(panel);
        if (!nextPanel) {
          const next = { ...prev };
          delete next[tabId];
          return next;
        }

        return {
          ...prev,
          [tabId]: nextPanel
        };
      });
    },
    []
  );

  const ensurePanelReady = useCallback(
    async (request: ConditionalPasskeyRequest, promptForPermission: boolean) => {
      const tabId = request.tabId;
      if (tabId === null) {
        return;
      }

      const status = promptForPermission
        ? await flow.passkey.requestPermissionToListPasskeys()
        : await flow.passkey.hasPermissionToListPasskeys();

      if (!isCurrentOperation(tabId, request.operationId)) {
        return;
      }

      if (status === "denied") {
        updatePanel(tabId, (panel) => ({
          ...panel,
          phase: "denied",
          initialized: true
        }));
        return;
      }

      if (status !== "authorized") {
        updatePanel(tabId, (panel) => ({
          ...panel,
          phase: "permission",
          initialized: true
        }));
        return;
      }

      updatePanel(tabId, (panel) => ({
        ...panel,
        phase: "list",
        initialized: true
      }));

      const passkeys = await flow.passkey.listPasskeys(request.rpId);
      if (!isCurrentOperation(tabId, request.operationId)) {
        return;
      }

      updatePanel(tabId, (panel) => ({
        ...panel,
        phase: "list",
        passkeys
      }));
    },
    [isCurrentOperation, updatePanel]
  );

  useEffect(() => {
    const activeRequests = conditionalRequests.filter((request) => request.tabId !== null);
    const activeRequestsByTabId = new Map(activeRequests.map((request) => [request.tabId as number, request]));
    activeRequestsByTabIdRef.current = activeRequestsByTabId;

    // Determine which requests need initialization synchronously using the ref,
    // before calling setPanelsByTabId (whose updater runs asynchronously in React 18).
    const currentPanels = panelsByTabIdRef.current;
    const requestsToInitialize = activeRequests.filter((request) => {
      if (request.state !== "started") return false;
      const tabId = request.tabId as number;
      const currentPanel = currentPanels[tabId];
      return !currentPanel || currentPanel.request.operationId !== request.operationId;
    });

    setPanelsByTabId((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const request of activeRequests) {
        const tabId = request.tabId as number;
        const currentPanel = prev[tabId];

        if (!currentPanel || currentPanel.request.operationId !== request.operationId) {
          next[tabId] = createPanel(request);
          changed = true;
          continue;
        }

        const nextPanel = syncPanelWithRequest(currentPanel, request);
        if (nextPanel !== currentPanel) {
          next[tabId] = nextPanel;
          changed = true;
        }
      }

      for (const [tabIdString, panel] of Object.entries(prev)) {
        const tabId = Number(tabIdString);
        if (activeRequestsByTabId.has(tabId)) {
          continue;
        }

        if (panel.visibility === "open" || panel.isClosing) {
          if (!panel.isClosing) {
            next[tabId] = {
              ...panel,
              isClosing: true
            };
            changed = true;
          }
          continue;
        }

        delete next[tabId];
        changed = true;
      }

      return changed ? next : prev;
    });

    for (const request of requestsToInitialize) {
      void ensurePanelReady(request, false);
    }
  }, [conditionalRequests, ensurePanelReady]);

  const dismissPanel = useCallback(
    (tabId: number) => {
      updatePanel(tabId, (panel) => ({
        ...panel,
        visibility: "dismissed",
        isClosing: panel.visibility === "open" ? true : panel.isClosing
      }));
    },
    [updatePanel]
  );

  const requestPermission = useCallback(
    async (tabId: number) => {
      const panel = panelsByTabIdRef.current[tabId];
      if (!panel) {
        return;
      }

      await ensurePanelReady(panel.request, true);
    },
    [ensurePanelReady]
  );

  const selectPasskey = useCallback(
    async (tabId: number, passkey: PasskeyCredential) => {
      const panel = panelsByTabIdRef.current[tabId];
      if (!panel) {
        return;
      }

      updatePanel(tabId, (currentPanel) => ({
        ...currentPanel,
        visibility: "hidden-by-selection",
        isClosing: currentPanel.visibility === "open" ? true : currentPanel.isClosing
      }));

      const accepted = await flow.passkey.selectConditionalPasskey(panel.request.operationId, passkey.id);
      if (accepted || !isCurrentOperation(tabId, panel.request.operationId)) {
        return;
      }

      updatePanel(tabId, (currentPanel) => ({
        ...currentPanel,
        visibility: "open",
        isClosing: false
      }));
    },
    [isCurrentOperation, updatePanel]
  );

  const handleAnimationComplete = useCallback((tabId: number) => {
    const activeRequest = activeRequestsByTabIdRef.current.get(tabId);

    setPanelsByTabId((prev) => {
      const panel = prev[tabId];
      if (!panel || !panel.isClosing) {
        return prev;
      }

      if (!activeRequest) {
        const next = { ...prev };
        delete next[tabId];
        return next;
      }

      return {
        ...prev,
        [tabId]: {
          ...panel,
          request: activeRequest,
          isClosing: false
        }
      };
    });
  }, []);

  const renderedPanels = useMemo(() => {
    const all = Object.values(panelsByTabId);
    return all.filter((panel) => panel.initialized && (panel.visibility === "open" || panel.isClosing));
  }, [panelsByTabId]);

  return {
    panels: renderedPanels,
    dismissPanel,
    requestPermission,
    selectPasskey,
    handleAnimationComplete
  };
}

/* ---------------------------------- Main Component ---------------------------------- */

export function PasskeyConditionalUI({ anchorRef }: PasskeyConditionalUIProps) {
  const focusedTabId = useFocusedTabId();
  const { conditionalRequests } = usePasskeyRequests();
  const anchorRect = useBoundingRect(anchorRef);
  const { panels, dismissPanel, requestPermission, selectPasskey, handleAnimationComplete } =
    useConditionalPasskeyPanels(conditionalRequests);
  const [panelHeights, setPanelHeights] = useState<Record<number, number>>({});

  useEffect(() => {
    setPanelHeights((prev) => {
      const activeTabIds = new Set(panels.map((panel) => panel.tabId));
      let changed = false;
      const next = { ...prev };

      for (const tabIdString of Object.keys(prev)) {
        const tabId = Number(tabIdString);
        if (activeTabIds.has(tabId)) {
          continue;
        }

        delete next[tabId];
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [panels]);

  const handlePanelResize = useCallback((tabId: number, height: number) => {
    setPanelHeights((prev) => {
      if (prev[tabId] === height) {
        return prev;
      }

      return {
        ...prev,
        [tabId]: height
      };
    });
  }, []);

  if (!anchorRect) return null;

  return (
    <>
      {panels.map((panel) => {
        const { tabId, request, passkeys, isClosing } = panel;
        const height = panelHeights[tabId];

        const portalStyle: React.CSSProperties = {
          top: anchorRect.y + PASSKEY_PANEL_PADDING,
          right: window.innerWidth - anchorRect.right + PASSKEY_PANEL_PADDING,
          width: PASSKEY_PANEL_WIDTH,
          ...(height !== undefined ? { height } : {})
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
              relyingPartyLabel={request?.rpId ?? ""}
              panelState={panel.phase}
              passkeys={passkeys}
              isVisible={!isClosing}
              onClose={() => dismissPanel(tabId)}
              onStateChange={() => requestPermission(tabId)}
              onPasskeySelected={(passkey) => selectPasskey(tabId, passkey)}
              onResize={(nextHeight) => handlePanelResize(tabId, nextHeight)}
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
  passkeys,
  isVisible,
  onClose,
  onStateChange,
  onPasskeySelected,
  onResize,
  onAnimationComplete
}: {
  relyingPartyLabel: string;
  panelState: PanelState;
  passkeys: PasskeyCredential[];
  isVisible: boolean;
  onClose: () => void;
  onStateChange: (state: PanelState) => void;
  onPasskeySelected: (passkey: PasskeyCredential) => void;
  onResize?: (height: number) => void;
  onAnimationComplete: () => void;
}) {
  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && (
        <PanelContainer onResize={onResize}>
          <PanelHeader onClose={onClose} />
          {panelState === "denied" ? (
            <DeniedContent />
          ) : panelState === "permission" ? (
            <PermissionContent onAllow={() => onStateChange("list")} />
          ) : (
            <PasskeyListContent
              relyingPartyLabel={relyingPartyLabel}
              passkeys={passkeys}
              onSelect={onPasskeySelected}
            />
          )}
        </PanelContainer>
      )}
    </AnimatePresence>
  );
}
