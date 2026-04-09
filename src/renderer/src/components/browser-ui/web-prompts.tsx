import { memo, useRef } from "react";
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

function JavaScriptDialogCard({ prompt, tab }: { prompt: ActivePrompt; tab: TabData }) {
  const { type } = prompt;

  const selectDefaultOnceRef = useRef(true);
  return (
    <Card className={cn("w-full max-w-md select-none gap-5", "border border-white/25", "shadow-2xl shadow-black/40")}>
      <CardHeader>
        <CardTitle>{`${getOriginFromURL(tab.url)} says`}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-5">
          {(type === "prompt" || prompt.message.trim()) && (
            <Field>
              <FieldLabel htmlFor="prompt">{prompt.message.trim()}</FieldLabel>
              {type === "prompt" && (
                <Input
                  id="prompt"
                  autoFocus
                  defaultValue={prompt.defaultValue}
                  onFocus={(e) => {
                    if (!selectDefaultOnceRef.current) return;
                    selectDefaultOnceRef.current = false;
                    e.currentTarget.select();
                  }}
                />
              )}
            </Field>
          )}

          <Field orientation="horizontal">
            <Checkbox id="suppress-dialogs" name="suppress-dialogs" />
            <FieldLabel htmlFor="suppress-dialogs">Prevent this page from creating additional dialogs</FieldLabel>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end flex-row gap-2">
        {(type === "prompt" || type === "confirm") && (
          <Button variant="outline" className="flex-1">
            Cancel
            <span className="text-xs text-muted-foreground">Esc</span>
          </Button>
        )}
        <Button variant="default" className="flex-1">
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
  return (
    <PortalComponent
      visible={isVisible}
      autoFocus
      zIndex={ViewLayer.OVERLAY_UNDER}
      className="fixed"
      style={portalStyle}
    >
      <ThemeProvider>
        <div className={cn("w-full h-full", "bg-black/25 rounded-lg", "flex items-center justify-center")}>
          <JavaScriptDialogCard prompt={prompt} tab={tab} />
        </div>
      </ThemeProvider>
    </PortalComponent>
  );
});

export function WebPrompts({ anchorRef }: WebPromptsProps) {
  const focusedTabId = useFocusedTabId();
  const { tabsData } = useTabs();
  const anchorRect = useBoundingRect(anchorRef);

  if (!tabsData || !anchorRect) return null;

  const { activePrompts: allActivePrompts } = useActivePrompts();
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
