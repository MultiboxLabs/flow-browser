import { AutocompleteInput } from "@/lib/omnibox/types";
import { BaseProvider } from "@/lib/omnibox/base-provider";
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

    // Match against known triggers using simple prefix/includes matching.
    // Pedals are short, known strings — full tokenized matching is overkill here.
    const results: AutocompleteMatch[] = [];
    for (const pedal of PEDALS) {
      let bestScore = 0;

      for (const trigger of pedal.triggers) {
        if (inputText === trigger) {
          // Exact match
          bestScore = Math.max(bestScore, 1.0);
        } else if (trigger.startsWith(inputText)) {
          // Input is a prefix of the trigger
          bestScore = Math.max(bestScore, 0.6 + (inputText.length / trigger.length) * 0.3);
        } else if (trigger.includes(inputText)) {
          // Input is a substring of the trigger
          bestScore = Math.max(bestScore, 0.3 + (inputText.length / trigger.length) * 0.2);
        }
      }

      if (bestScore > 0) {
        const relevance = Math.ceil(1100 + bestScore * 100);
        results.push({
          providerName: this.name,
          relevance, // Very high relevance for direct actions
          contents: pedal.description,
          destinationUrl: pedal.action,
          type: "pedal",
          isDefault: false
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
