import type { OmniboxSuggestion } from "../types";
import { stringSimilarity } from "string-similarity-js";

interface Pedal {
  triggers: string[];
  action: string;
  description: string;
}

const SIMILARITY_THRESHOLD = 0.4;

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

// Icons are stored at `src/renderer/src/components/omnibox/pedal-glyph.tsx`
const PEDALS = [
  {
    triggers: ["open settings", "settings", "app icon", "profiles", "spaces", "about flow", "onboarding"],
    action: "open_settings",
    description: "Open settings"
  },
  {
    triggers: ["new window", "window", "browser window"],
    action: "open_new_window",
    description: "Open new window"
  },
  {
    triggers: ["incognito", "new incognito window", "private window"],
    action: "open_incognito_window",
    description: "Open incognito window"
  },
  {
    triggers: ["extensions", "extension", "extension manager"],
    action: "open_extensions",
    description: "Extensions Manager"
  },
  {
    triggers: ["history", "browse history", "browsing history"],
    action: "open_history",
    description: "History"
  }
] satisfies Pedal[];

export function getPedalSuggestions(trimmedInput: string): OmniboxSuggestion[] {
  const pedalSuggestions: OmniboxSuggestion[] = [];

  for (const pedal of PEDALS) {
    let bestSimilarity = 0;

    for (const trigger of pedal.triggers) {
      const similarity = stringSimilarity(trimmedInput, trigger, undefined, false);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
      }
    }

    if (bestSimilarity > SIMILARITY_THRESHOLD) {
      let relevance = 0;
      if (bestSimilarity > 0.85) {
        // If similarity is between 0.85 and 1, relevance should be between 600 and 700
        relevance = mapRange(bestSimilarity, 0.85, 1, 600, 700);
      } else {
        // If similarity is between 0.4 and 0.85, relevance should be between 300 and 400
        relevance = mapRange(bestSimilarity, 0.4, 0.85, 300, 400);
      }

      pedalSuggestions.push({
        type: "pedal",
        title: pedal.description,
        action: pedal.action,
        relevance
      });
    }
  }

  return pedalSuggestions;
}
