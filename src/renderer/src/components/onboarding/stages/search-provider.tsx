import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { WebsiteFavicon } from "@/components/main/website-favicon";
import type { SearchProviderId } from "@/lib/omnibox-new/search-providers";
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
    name: "Custom",
    icon: <SearchCode className="size-9" />
  }
];

export function OnboardingSearchProvider({ advance }: { advance: OnboardingAdvanceCallback }) {
  const { getSetting, setSetting } = useSettings();
  const selectedProvider = getSetting<unknown>("searchEngine");
  const selectedProviderId = isSearchProviderId(selectedProvider) ? selectedProvider : null;

  const handleSelectProvider = (providerId: SearchProviderId) => {
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
            const isSelected = provider.kind === "provider" && provider.id === selectedProviderId;
            const isAvailable = provider.kind === "provider";

            return (
              <button
                key={provider.id}
                type="button"
                onClick={() => {
                  if (provider.kind === "provider") {
                    handleSelectProvider(provider.id);
                  }
                }}
                disabled={!isAvailable}
                className={cn(
                  "group remove-app-drag relative flex min-h-52 flex-col items-center justify-center rounded-3xl border bg-white/3 px-6 py-8 text-white transition-all duration-200",
                  isAvailable
                    ? "cursor-pointer border-white/10 hover:border-white/25 hover:bg-white/6"
                    : "cursor-not-allowed border-white/8 opacity-60",
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

                <span className={cn("mt-2 text-sm", isAvailable ? "text-white/55" : "text-white/40")}>
                  {isAvailable ? (isSelected ? "Selected" : "Set as default") : "Coming soon"}
                </span>
              </button>
            );
          })}
        </div>
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
            className="cursor-pointer px-10 py-6 text-lg bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-white backdrop-blur-md border border-[#0066FF]/30 gap-2"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </>
  );
}
