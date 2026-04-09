import { memo, useCallback, useEffect, useRef, useState } from "react";
import { PortalComponent } from "@/components/portal/portal";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFocusedTabId, useTabs } from "@/components/providers/tabs-provider";
import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { cn } from "@/lib/utils";
import { ViewLayer } from "~/layers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeProvider } from "@/components/main/theme";
import { useActivePrompts } from "@/components/providers/active-prompts-provider";
import type { ActivePrompt } from "~/types/prompts";
import type { TabData } from "~/types/tabs";
import { useMount } from "react-use";

const supressedKeys = new Set<string>();

interface WebPromptsProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function getOriginFromURL(url: string): string {
  try {
    const urlObject = new URL(url);
    const protocol = urlObject.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:") {
      return urlObject.hostname;
    }
    return urlObject.origin;
  } catch {
    return url;
  }
}

function JavaScriptDialogCard({
  prompt,
  tab,
  setShouldAutofocus
}: {
  prompt: ActivePrompt;
  tab: TabData;
  setShouldAutofocus: (shouldAutofocus: boolean) => void;
}) {
  const { type } = prompt;

  const cardRef = useRef<HTMLDivElement>(null);
  const selectDefaultOnceRef = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tabStartingUrl] = useState(() => tab.url);

  const supressionKey = `${prompt.tabId}-${getOriginFromURL(tabStartingUrl)}`;
  const isSupressed = supressedKeys.has(supressionKey);
  const [suppressChecked, setSuppressChecked] = useState(() => isSupressed);

  const processSupression = useCallback(() => {
    if (suppressChecked) {
      supressedKeys.add(supressionKey);
    } else {
      supressedKeys.delete(supressionKey);
    }
  }, [supressionKey, suppressChecked]);

  const cancel = useCallback(() => {
    switch (type) {
      case "prompt":
        flow.prompts.confirmPrompt(prompt.id, null);
        break;
      case "confirm":
        flow.prompts.confirmPrompt(prompt.id, false);
        break;
      case "alert":
        flow.prompts.confirmPrompt(prompt.id, undefined);
        break;
    }
    processSupression();
  }, [type, prompt.id, processSupression]);

  const confirm = useCallback(() => {
    const value = inputRef.current?.value;
    switch (type) {
      case "prompt":
        flow.prompts.confirmPrompt(prompt.id, value);
        break;
      case "confirm":
        flow.prompts.confirmPrompt(prompt.id, true);
        break;
      case "alert":
        flow.prompts.confirmPrompt(prompt.id, undefined);
        break;
    }
    processSupression();
  }, [type, prompt.id, processSupression]);

  useMount(() => {
    if (isSupressed) {
      cancel();
    } else {
      setShouldAutofocus(true);
    }
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const document = card.ownerDocument;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        cancel();
      }
      if (e.key === "Enter") {
        confirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirm, cancel]);

  return (
    <Card
      ref={cardRef}
      className={cn("w-full max-w-md select-none gap-5", "border border-white/25", "shadow-2xl shadow-black/40")}
    >
      <CardHeader>
        <CardTitle>{`${getOriginFromURL(tabStartingUrl)} says`}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-5">
          {(type === "prompt" || prompt.message.trim()) && (
            <Field>
              {prompt.message.trim() && (
                <div className="overflow-y-auto max-h-[30vh] custom-scrollbar">
                  <FieldLabel htmlFor="prompt" className="whitespace-pre-line wrap-break-word min-w-0">
                    {prompt.message.trim()}
                  </FieldLabel>
                </div>
              )}
              {type === "prompt" && (
                <Input
                  id="prompt"
                  autoFocus
                  defaultValue={prompt.defaultValue}
                  ref={inputRef}
                  onFocus={(e) => {
                    if (!selectDefaultOnceRef.current) return;
                    selectDefaultOnceRef.current = false;
                    e.currentTarget.select();
                  }}
                />
              )}
            </Field>
          )}

          {(type === "prompt" || type === "confirm" || type === "alert") && (
            <Field orientation="horizontal">
              <Checkbox
                id="suppress-dialogs"
                name="suppress-dialogs"
                defaultChecked={suppressChecked}
                onCheckedChange={(checked) => (checked === true ? setSuppressChecked(true) : setSuppressChecked(false))}
              />
              <FieldLabel htmlFor="suppress-dialogs">Prevent this page from creating additional dialogs</FieldLabel>
            </Field>
          )}
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end flex-row gap-2">
        {(type === "prompt" || type === "confirm") && (
          <Button variant="outline" className="flex-1" onClick={cancel}>
            Cancel
            <span className="text-xs text-muted-foreground">Esc</span>
          </Button>
        )}
        <Button variant="default" className="flex-1" onClick={confirm}>
          OK
          <span className="text-xs text-muted">↵</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

const TabWebPrompt = memo(function TabWebPrompt({
  isVisible,
  portalStyle,
  prompt,
  tab
}: {
  isVisible: boolean;
  portalStyle: React.CSSProperties;
  prompt: ActivePrompt;
  tab: TabData;
}) {
  // don't autofocus on first render, if dialogs are suppressed we don't want the page to lose focus
  const [shouldAutofocus, setShouldAutofocus] = useState(false);
  return (
    <PortalComponent
      visible={isVisible}
      autoFocus={shouldAutofocus}
      zIndex={ViewLayer.OVERLAY_UNDER}
      className="fixed"
      style={portalStyle}
    >
      <ThemeProvider>
        <div className={cn("w-full h-full", "bg-black/25 rounded-lg", "flex items-center justify-center")}>
          <JavaScriptDialogCard prompt={prompt} tab={tab} setShouldAutofocus={setShouldAutofocus} />
        </div>
      </ThemeProvider>
    </PortalComponent>
  );
});

export function WebPrompts({ anchorRef }: WebPromptsProps) {
  const focusedTabId = useFocusedTabId();
  const { tabsData } = useTabs();
  const anchorRect = useBoundingRect(anchorRef);
  const { activePrompts: allActivePrompts } = useActivePrompts();

  if (!tabsData || !anchorRect) return null;

  const activePrompts = allActivePrompts.filter((prompt) => tabsData.tabs.some((tab) => tab.id === prompt.tabId));

  const portalStyle: React.CSSProperties = {
    top: anchorRect.y,
    left: anchorRect.x,
    width: anchorRect.width,
    height: anchorRect.height
  };

  return (
    <>
      {activePrompts.map((prompt) => {
        const tabId = prompt.tabId;
        const tab = tabsData.tabs.find((tab) => tab.id === tabId);
        if (!tab) return null;

        return (
          <TabWebPrompt
            key={tabId}
            isVisible={tabId === focusedTabId}
            portalStyle={portalStyle}
            prompt={prompt}
            tab={tab}
          />
        );
      })}
    </>
  );
}
