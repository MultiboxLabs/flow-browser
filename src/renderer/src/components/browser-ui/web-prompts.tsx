import { memo } from "react";
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

interface WebPromptsProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function JavaScriptDialogCard() {
  return (
    <Card className={cn("w-full max-w-md select-none gap-5", "border border-white/25", "shadow-2xl shadow-black/40")}>
      <CardHeader>
        <CardTitle>{"www.youtube.com says"}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel htmlFor="prompt">Who are you?</FieldLabel>
            <Input id="prompt" defaultValue="John Doe" />
          </Field>
          <Field orientation="horizontal">
            <Checkbox id="suppress-dialogs" name="suppress-dialogs" />
            <FieldLabel htmlFor="suppress-dialogs">Prevent this page from creating additional dialogs</FieldLabel>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end flex-row gap-2">
        <Button variant="outline" className="flex-1">
          Cancel
          <span className="text-xs text-muted-foreground">Esc</span>
        </Button>
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
  portalStyle
}: {
  isVisible: boolean;
  portalStyle: React.CSSProperties;
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
          <JavaScriptDialogCard />
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

  const portalStyle: React.CSSProperties = {
    top: anchorRect.y,
    left: anchorRect.x,
    width: anchorRect.width,
    height: anchorRect.height
  };

  // return null;

  return (
    <>
      {tabsData.tabs.map((tab) => (
        <TabWebPrompt key={tab.id} isVisible={tab.id === focusedTabId} portalStyle={portalStyle} />
      ))}
    </>
  );
}
