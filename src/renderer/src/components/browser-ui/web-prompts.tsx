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
import { ThemeConsumer } from "@/components/main/theme";
import { useActivePrompts } from "@/components/providers/active-prompts-provider";
import type { ActivePrompt, BasicAuthCredentials } from "~/types/prompts";
import { getOriginFromURL } from "~/utility";

const suppressablePromptTypes = ["prompt", "confirm", "alert"] as const satisfies ActivePrompt["type"][];

type JsDialogActivePrompt = Extract<ActivePrompt, { type: "prompt" | "confirm" | "alert" }>;
type BasicAuthActivePrompt = Extract<ActivePrompt, { type: "basic-auth" }>;

interface WebPromptsProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function JavaScriptDialogCard({ prompt }: { prompt: JsDialogActivePrompt }) {
  const { type } = prompt;

  const cardRef = useRef<HTMLDivElement>(null);
  const selectDefaultOnceRef = useRef(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const suppressionKey = prompt.suppressionKey;
  const [suppressChecked, setSuppressChecked] = useState(false);

  const cancel = useCallback(() => {
    switch (type) {
      case "prompt":
        flow.prompts.confirmPrompt(prompt.id, null, suppressChecked);
        break;
      case "confirm":
        flow.prompts.confirmPrompt(prompt.id, false, suppressChecked);
        break;
      case "alert":
        flow.prompts.confirmPrompt(prompt.id, undefined, suppressChecked);
        break;
    }
  }, [type, prompt.id, suppressChecked]);

  const confirm = useCallback(() => {
    const value = inputRef.current?.value;
    switch (type) {
      case "prompt":
        flow.prompts.confirmPrompt(prompt.id, value, suppressChecked);
        break;
      case "confirm":
        flow.prompts.confirmPrompt(prompt.id, true, suppressChecked);
        break;
      case "alert":
        flow.prompts.confirmPrompt(prompt.id, undefined, suppressChecked);
        break;
    }
  }, [type, prompt.id, suppressChecked]);

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
        <CardTitle>{`${prompt.originUrl ? getOriginFromURL(prompt.originUrl) : "Unknown website"} says`}</CardTitle>
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

          {suppressablePromptTypes.includes(type) && suppressionKey && (
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

function BasicAuthCard({ prompt }: { prompt: BasicAuthActivePrompt }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const usernameRef = useRef<HTMLInputElement | null>(null);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  const cancel = useCallback(() => {
    flow.prompts.confirmPrompt(prompt.id, null, false);
  }, [prompt.id]);

  const confirm = useCallback(() => {
    const username = usernameRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";
    const credentials: BasicAuthCredentials = { username, password };
    flow.prompts.confirmPrompt(prompt.id, credentials, false);
  }, [prompt.id]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const ownerDocument = card.ownerDocument;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      if (e.key === "Escape") {
        cancel();
      }
      if (e.key === "Enter") {
        confirm();
      }
    };

    ownerDocument.addEventListener("keydown", handleKeyDown);
    return () => {
      ownerDocument.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirm, cancel]);

  const originLabel = prompt.originUrl ? getOriginFromURL(prompt.originUrl) : "This site";

  return (
    <Card
      ref={cardRef}
      className={cn("w-full max-w-md select-none gap-5", "border border-white/25", "shadow-2xl shadow-black/40")}
    >
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-5">
          <Field>
            <FieldLabel className="text-muted-foreground">
              {`${originLabel} is requesting a username and password.`}
            </FieldLabel>
          </Field>
          <Field>
            <FieldLabel htmlFor="basic-auth-user">Username</FieldLabel>
            <Input id="basic-auth-user" autoFocus autoComplete="username" ref={usernameRef} />
          </Field>
          <Field>
            <FieldLabel htmlFor="basic-auth-pass">Password</FieldLabel>
            <Input id="basic-auth-pass" type="password" autoComplete="current-password" ref={passwordRef} />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="justify-end flex-row gap-2">
        <Button variant="outline" className="flex-1" onClick={cancel}>
          Cancel
          <span className="text-xs text-muted-foreground">Esc</span>
        </Button>
        <Button variant="default" className="flex-1" onClick={confirm}>
          Sign in
          <span className="text-xs text-muted">↵</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

const TabWebPrompt = memo(function TabWebPrompt({
  isVisible,
  portalStyle,
  prompt
}: {
  isVisible: boolean;
  portalStyle: React.CSSProperties;
  prompt: ActivePrompt;
}) {
  return (
    <PortalComponent
      visible={isVisible}
      autoFocus
      zIndex={ViewLayer.OVERLAY_UNDER}
      className="fixed"
      style={portalStyle}
    >
      <ThemeConsumer>
        <div className={cn("w-full h-full", "bg-black/25 rounded-md", "flex items-center justify-center")}>
          {prompt.type === "basic-auth" ? <BasicAuthCard prompt={prompt} /> : <JavaScriptDialogCard prompt={prompt} />}
        </div>
      </ThemeConsumer>
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
        return (
          <TabWebPrompt key={prompt.id} isVisible={tabId === focusedTabId} portalStyle={portalStyle} prompt={prompt} />
        );
      })}
    </>
  );
}
