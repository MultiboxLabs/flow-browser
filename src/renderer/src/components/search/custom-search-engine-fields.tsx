import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CUSTOM_SEARCH_QUERY_TOKEN,
  CUSTOM_SEARCH_TEMPLATE_EXAMPLE,
  validateCustomSearchUrlTemplate
} from "@/lib/omnibox-new/search-providers/custom-utils";
import type { CustomSearchSuggestionsProviderId } from "@/lib/omnibox-new/search-providers";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SUGGESTION_SOURCE_OPTIONS: Array<{ id: CustomSearchSuggestionsProviderId; name: string }> = [
  { id: "none", name: "No suggestions" },
  { id: "google", name: "Google suggestions" },
  { id: "duckduckgo", name: "DuckDuckGo suggestions" },
  { id: "yandex", name: "Yandex suggestions" }
];

export function CustomSearchEngineFields({
  template,
  onTemplateChange,
  suggestionsProvider,
  onSuggestionsProviderChange,
  appearance = "settings"
}: {
  template: string;
  onTemplateChange: (value: string) => void;
  suggestionsProvider: CustomSearchSuggestionsProviderId;
  onSuggestionsProviderChange: (value: CustomSearchSuggestionsProviderId) => void;
  appearance?: "settings" | "onboarding";
}) {
  const [draftTemplate, setDraftTemplate] = useState(template);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const lastCommittedTemplateRef = useRef(template);
  const validation = validateCustomSearchUrlTemplate(draftTemplate);
  const isOnboarding = appearance === "onboarding";

  useEffect(() => {
    if (!isEditingTemplate && template !== draftTemplate) {
      setDraftTemplate(template);
    }
    lastCommittedTemplateRef.current = template;
  }, [draftTemplate, isEditingTemplate, template]);

  useEffect(() => {
    if (!isEditingTemplate) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (draftTemplate !== lastCommittedTemplateRef.current) {
        onTemplateChange(draftTemplate);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [draftTemplate, isEditingTemplate, onTemplateChange]);

  const commitDraftTemplate = () => {
    setIsEditingTemplate(false);
    if (draftTemplate !== lastCommittedTemplateRef.current) {
      onTemplateChange(draftTemplate);
    }
  };

  return (
    <div
      className={cn(
        "space-y-5 rounded-2xl border p-5",
        isOnboarding ? "border-white/10 bg-white/5 backdrop-blur-md" : "border-border/60 bg-muted/25"
      )}
    >
      <div className="space-y-2">
        <Label htmlFor="custom-search-url-template" className={cn(isOnboarding && "text-white")}>
          Search URL template
        </Label>
        <Input
          id="custom-search-url-template"
          value={draftTemplate}
          onChange={(event) => setDraftTemplate(event.target.value)}
          onFocus={() => setIsEditingTemplate(true)}
          onBlur={commitDraftTemplate}
          placeholder={CUSTOM_SEARCH_TEMPLATE_EXAMPLE}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className={cn(
            "font-mono text-sm",
            isOnboarding && "border-white/20 bg-white/10 text-white placeholder:text-white/35"
          )}
          aria-invalid={!validation.valid}
        />
        <p className={cn("text-xs leading-5", isOnboarding ? "text-white/65" : "text-muted-foreground")}>
          Use <code className="rounded bg-black/10 px-1 py-0.5 font-mono">{CUSTOM_SEARCH_QUERY_TOKEN}</code> exactly
          where the search terms should go.
        </p>
        <p className={cn("text-xs leading-5", isOnboarding ? "text-white/50" : "text-muted-foreground")}>
          Example: <code className="rounded bg-black/10 px-1 py-0.5 font-mono">{CUSTOM_SEARCH_TEMPLATE_EXAMPLE}</code>
        </p>
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs leading-5",
            validation.valid
              ? isOnboarding
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : isOnboarding
                ? "border-amber-400/25 bg-amber-400/10 text-amber-100"
                : "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
          )}
        >
          {validation.valid ? (
            <CheckCircle2 className="size-4 shrink-0 self-center" />
          ) : (
            <AlertCircle className="size-4 shrink-0 self-center" />
          )}
          <span className="min-w-0">{validation.valid ? "This template looks good." : validation.reason}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-search-suggestions-provider" className={cn(isOnboarding && "text-white")}>
          Suggestions source
        </Label>
        <Select
          value={suggestionsProvider}
          onValueChange={(value) => onSuggestionsProviderChange(value as CustomSearchSuggestionsProviderId)}
        >
          <SelectTrigger
            id="custom-search-suggestions-provider"
            className={cn(isOnboarding && "border-white/20 bg-white/10 text-white")}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="remove-app-drag z-popover">
            {SUGGESTION_SOURCE_OPTIONS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className={cn("text-xs leading-5", isOnboarding ? "text-white/65" : "text-muted-foreground")}>
          This only controls autocomplete suggestions. Your searches still open with your custom URL template.
        </p>
      </div>
    </div>
  );
}
