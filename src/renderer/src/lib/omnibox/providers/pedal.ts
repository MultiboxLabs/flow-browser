import { AutocompleteInput } from "@/lib/omnibox-v2";
import { BaseProvider } from "@/lib/omnibox/base-provider";
import { getStringSimilarity } from "@/lib/omnibox/data-providers/string-similarity";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteMatch } from "@/lib/omnibox/types";

interface Pedal {
  triggers: string[];
  action: string;
  description: string;
}

const PEDALS = [
  {
    triggers: ["settings", "app icon", "profiles", "spaces", "about flow", "onboarding"],
    action: "open_settings",
    description: "Open settings"
  },
  {
    triggers: ["new window", "window", "browser window"],
    action: "open_new_window",
    description: "Open new window"
  },
  {
    triggers: ["extensions", "extension", "extension manager"],
    action: "open_extensions",
    description: "Extensions Manager"
  }
] satisfies Pedal[];

export class OmniboxPedalProvider extends BaseProvider {
  name = "OmniboxPedalProvider";

  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const inputText = input.text.toLowerCase().trim();
    if (!inputText) {
      onResults([]);
      return;
    }

    // Match against known triggers
    const results: AutocompleteMatch[] = [];
    for (const pedal of PEDALS) {
      if (pedal.triggers.some((trigger) => inputText === trigger || getStringSimilarity(inputText, trigger) > 0)) {
        // Score should be between 1100 - 1200
        const bestSimilarity = pedal.triggers.reduce((best, trigger) => {
          const similarity = getStringSimilarity(inputText, trigger);
          return similarity > best ? similarity : best;
        }, 0);

        const relevance = Math.ceil(1100 + bestSimilarity * 100);
        results.push({
          providerName: this.name,
          relevance, // Very high relevance for direct actions
          contents: pedal.description, // Display the action text
          // Destination URL could be an internal settings page or command
          destinationUrl: pedal.action,
          type: "pedal",
          isDefault: false // Pedals are often default if triggered
        });
        // Typically only one pedal is shown at a time
        break;
      }
    }
    onResults(results);
  }

  stop(): void {
    // No cleanup needed
  }
}
