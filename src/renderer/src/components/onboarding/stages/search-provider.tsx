import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { WebsiteFavicon } from "@/components/main/website-favicon";
import { CustomSearchEngineFields } from "@/components/search/custom-search-engine-fields";
import type {
  CustomSearchSuggestionsProviderId,
  SearchEngineSettingId,
  SearchProviderId
} from "@/lib/omnibox-new/search-providers";
import { validateCustomSearchUrlTemplate } from "@/lib/omnibox-new/search-providers/custom-utils";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/components/providers/settings-provider";
import { ArrowRight, SearchCode } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type AvailableSearchProviderTile = {
  kind: "provider";
  id: SearchProviderId;
  name: string;
  url: string;
  favicon: string;
};

type CustomSearchProviderTile = {
  kind: "custom";
  id: "custom";
  name: string;
  icon: ReactNode;
};

type SearchProviderTile = AvailableSearchProviderTile | CustomSearchProviderTile;

function isSearchProviderId(value: unknown): value is SearchProviderId {
  return value === "google" || value === "duckduckgo" || value === "yandex";
}

function isSearchEngineSettingId(value: unknown): value is SearchEngineSettingId {
  return value === "custom" || isSearchProviderId(value);
}

const SEARCH_PROVIDER_TILES: SearchProviderTile[] = [
  {
    kind: "provider",
    id: "google",
    name: "Google",
    url: "https://www.google.com",
    favicon: "https://www.google.com/favicon.ico"
  },
  {
    kind: "provider",
    id: "duckduckgo",
    name: "DuckDuckGo",
    url: "https://duckduckgo.com",
    favicon: "https://duckduckgo.com/favicon.ico"
  },
  {
    kind: "provider",
    id: "yandex",
    name: "Yandex",
    url: "https://yandex.com",
    favicon: "https://yandex.com/favicon.ico"
  },
  {
    kind: "custom",
    id: "custom",
    name: "Custom Search Engine",
    icon: <SearchCode className="size-9" />
  }
];

export function OnboardingSearchProvider({ advance }: { advance: OnboardingAdvanceCallback }) {
  const { getSetting, setSetting } = useSettings();
  const selectedProvider = getSetting<unknown>("searchEngine");
  const selectedProviderId = isSearchEngineSettingId(selectedProvider) ? selectedProvider : "google";
  const customSearchUrlTemplate = getSetting<string>("customSearchUrlTemplate") ?? "";
  const customSearchSuggestionsProvider =
    (getSetting<string>("customSearchSuggestionsProvider") as CustomSearchSuggestionsProviderId | undefined) ?? "none";
  const customSearchTemplateValidation = validateCustomSearchUrlTemplate(customSearchUrlTemplate);
  const canContinue = selectedProviderId !== "custom" || customSearchTemplateValidation.valid;

  const handleSelectProvider = (providerId: SearchEngineSettingId) => {
    if (providerId === selectedProviderId) {
      return;
    }

    void setSetting("searchEngine", providerId);
  };

  return (
    <>
      {/* Header */}
      <motion.div
        className="relative z-elevated text-center max-w-2xl px-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Search Provider</h1>
        <p className="text-gray-400 text-lg">Choose your preferred search engine</p>
      </motion.div>

      {/* Search Provider Tiles */}
      <motion.div
        className="relative z-elevated w-full max-w-4xl px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {SEARCH_PROVIDER_TILES.map((provider) => {
            const isSelected = provider.id === selectedProviderId;

            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleSelectProvider(provider.id)}
                className={cn(
                  "group remove-app-drag relative flex min-h-52 flex-col items-center justify-center rounded-3xl border bg-white/3 px-6 py-8 text-white transition-all duration-200",
                  "cursor-pointer border-white/10 hover:border-white/25 hover:bg-white/6",
                  isSelected && "border-[#9BFFB0] bg-[#9BFFB0]/8 shadow-[0_0_0_1px_rgba(155,255,176,0.25)]"
                )}
              >
                <div
                  className={cn(
                    "mb-5 flex size-16 items-center justify-center rounded-full border border-white/10 bg-black/20",
                    isSelected && "border-[#9BFFB0]/40 bg-[#9BFFB0]/10"
                  )}
                >
                  {provider.kind === "provider" ? (
                    <WebsiteFavicon
                      url={provider.url}
                      favicon={provider.favicon}
                      className="size-9 rounded-full object-contain"
                    />
                  ) : (
                    provider.icon
                  )}
                </div>

                <span className="text-xl font-semibold tracking-tight">{provider.name}</span>

                <span className="mt-2 text-sm text-white/55">
                  {isSelected
                    ? "Selected"
                    : provider.kind === "custom"
                      ? "Use your own URL template"
                      : "Set as default"}
                </span>
              </button>
            );
          })}
        </div>

        {selectedProviderId === "custom" && (
          <motion.div
            className="mx-auto mt-4 w-full max-w-3xl"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <CustomSearchEngineFields
              appearance="onboarding"
              template={customSearchUrlTemplate}
              onTemplateChange={(value) => {
                void setSetting("customSearchUrlTemplate", value);
              }}
              suggestionsProvider={customSearchSuggestionsProvider}
              onSuggestionsProviderChange={(value) => {
                void setSetting("customSearchSuggestionsProvider", value);
              }}
            />
          </motion.div>
        )}
      </motion.div>

      {/* Continue Button */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        >
          <Button
            onClick={advance}
            disabled={!canContinue}
            className="cursor-pointer px-10 py-6 text-lg bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-white backdrop-blur-md border border-[#0066FF]/30 gap-2"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
        {!canContinue && (
          <p className="mt-3 text-center text-sm text-amber-200/80">
            Enter a valid custom search URL template before continuing.
          </p>
        )}
      </div>
    </>
  );
}
