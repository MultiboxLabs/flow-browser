type StackFrame = {
  context_line?: string;
  pre_context?: string[];
  post_context?: string[];
  vars?: Record<string, unknown>;
};

type Exception = {
  value?: string;
  stacktrace?: {
    frames?: StackFrame[];
  };
};

const URL_PATTERN = /https?:\/\/[^\s"'`,;)}\]>]+/gi;

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const IPV4_PATTERN = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|1?\d\d?)\b/g;

/**
 * Redacts the path, query, and fragment from a URL, keeping only the origin.
 * e.g. "https://example.com/private/page?q=secret" → "https://example.com/[REDACTED]"
 */
function redactUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const hasPath = parsed.pathname !== "/" || parsed.search || parsed.hash;
    return hasPath ? `${parsed.origin}/[REDACTED]` : parsed.origin;
  } catch {
    return "[REDACTED_URL]";
  }
}

/**
 * Sanitizes a string by redacting URLs, email addresses, and IP addresses.
 */
export function sanitizeString(input: string): string {
  return input
    .replace(URL_PATTERN, (match) => redactUrl(match))
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]")
    .replace(IPV4_PATTERN, "[REDACTED_IP]");
}

/**
 * Recursively sanitizes values in an object, redacting PII from string values.
 * Keys that are known to carry sensitive data are fully redacted.
 */
function sanitizeValue(value: unknown, depth: number = 0): unknown {
  if (depth > 8) return "[TRUNCATED]";

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value !== null && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeValue(val, depth + 1);
      }
    }
    return sanitized;
  }

  return value;
}

const SENSITIVE_KEYS = new Set([
  "url",
  "href",
  "uri",
  "address",
  "email",
  "title",
  "cookie",
  "cookies",
  "authorization",
  "password",
  "secret",
  "token",
  "referer",
  "referrer",
  "x-forwarded-for"
]);

/**
 * Sanitizes a stack frame, redacting PII from context lines while
 * preserving structural information needed for debugging.
 */
function sanitizeStackFrame(frame: StackFrame): StackFrame {
  const sanitized = { ...frame };

  if (sanitized.context_line) {
    sanitized.context_line = sanitizeString(sanitized.context_line);
  }
  if (sanitized.pre_context) {
    sanitized.pre_context = sanitized.pre_context.map(sanitizeString);
  }
  if (sanitized.post_context) {
    sanitized.post_context = sanitized.post_context.map(sanitizeString);
  }
  if (sanitized.vars) {
    sanitized.vars = sanitizeValue(sanitized.vars) as Record<string, unknown>;
  }

  return sanitized;
}

/**
 * Sanitizes a single exception entry, redacting PII from the value (message)
 * and stack frames.
 */
function sanitizeException(exception: Exception): Exception {
  const sanitized = { ...exception };

  if (sanitized.value) {
    sanitized.value = sanitizeString(sanitized.value);
  }

  if (sanitized.stacktrace?.frames) {
    sanitized.stacktrace = {
      ...sanitized.stacktrace,
      frames: sanitized.stacktrace.frames.map(sanitizeStackFrame)
    };
  }

  return sanitized;
}

/**
 * Sanitizes all exception and event properties before they are sent to PostHog.
 * Redacts URLs, emails, IP addresses, and known sensitive keys.
 */
export function sanitizeProperties(properties: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...properties };

  if (Array.isArray(sanitized.$exception_list)) {
    sanitized.$exception_list = (sanitized.$exception_list as Exception[]).map(sanitizeException);
  }

  for (const [key, value] of Object.entries(sanitized)) {
    if (key === "$exception_list") continue;

    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeValue(value);
    }
  }

  return sanitized;
}
