export const CUSTOM_SEARCH_QUERY_TOKEN = "{{query}}";
export const CUSTOM_SEARCH_TEMPLATE_EXAMPLE = `https://www.google.com/search?q=${CUSTOM_SEARCH_QUERY_TOKEN}`;

export type CustomSearchTemplateValidationResult =
  | {
      valid: true;
    }
  | {
      valid: false;
      reason: string;
    };

export function validateCustomSearchUrlTemplate(template: string): CustomSearchTemplateValidationResult {
  const trimmedTemplate = template.trim();

  if (!trimmedTemplate) {
    return {
      valid: false,
      reason: `Enter a full search URL and include ${CUSTOM_SEARCH_QUERY_TOKEN} where the query should go.`
    };
  }

  if (!trimmedTemplate.includes(CUSTOM_SEARCH_QUERY_TOKEN)) {
    return {
      valid: false,
      reason: `Add ${CUSTOM_SEARCH_QUERY_TOKEN} to the URL so Flow knows where to place the search terms.`
    };
  }

  const previewUrl = trimmedTemplate.replaceAll(CUSTOM_SEARCH_QUERY_TOKEN, "flow");

  try {
    const parsed = new URL(previewUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return {
        valid: false,
        reason: "Use a full http:// or https:// URL."
      };
    }

    if (!parsed.hostname) {
      return {
        valid: false,
        reason: "Use a full URL with a valid domain name."
      };
    }
  } catch {
    return {
      valid: false,
      reason: "Use a valid full URL, for example https://example.com/search?q={{query}}."
    };
  }

  return { valid: true };
}

export function buildCustomSearchUrl(template: string, query: string): string | null {
  const validation = validateCustomSearchUrlTemplate(template);
  if (!validation.valid) {
    return null;
  }

  return template.trim().replaceAll(CUSTOM_SEARCH_QUERY_TOKEN, encodeURIComponent(query));
}
