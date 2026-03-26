import type { SearchProviderCompletion } from "./types";

export function resolveCompletionUrl(completion: SearchProviderCompletion): string | null {
  if (completion.kind === "navigation") {
    return completion.url;
  }
  return null;
}
