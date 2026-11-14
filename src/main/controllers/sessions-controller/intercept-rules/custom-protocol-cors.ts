import { createBetterWebRequest } from "@/controllers/sessions-controller/web-requests";
import type { Session } from "electron";

const CUSTOM_PROTOCOLS = new Set(["flow:", "flow-internal:", "flow-external:"]);

const ALLOWED_ORIGIN_PROTOCOLS_BY_TARGET_PROTOCOL: Record<string, readonly string[]> = {
  "flow:": ["flow:", "flow-internal:"],
  "flow-internal:": ["flow-internal:"],
  "flow-external:": ["flow-external:"]
};

const CORS_RESPONSE_HEADERS = new Set([
  "access-control-allow-origin",
  "access-control-allow-credentials",
  "access-control-allow-headers",
  "access-control-allow-methods",
  "access-control-expose-headers"
]);

type CorsRequestMetadata = {
  origin: string;
  requestedHeaders?: string;
  requestedMethod?: string;
};

function getProtocol(url: string | undefined): string | null {
  if (!url) return null;

  try {
    return new URL(url).protocol;
  } catch {
    return null;
  }
}

function getHeader(headers: Record<string, string> | undefined, name: string): string | undefined {
  if (!headers) return undefined;

  const normalizedName = name.toLowerCase();
  for (const [headerName, headerValue] of Object.entries(headers)) {
    if (headerName.toLowerCase() === normalizedName) {
      return headerValue;
    }
  }

  return undefined;
}

function stripCorsResponseHeaders(responseHeaders: Record<string, string[]> | undefined) {
  const headers = { ...(responseHeaders ?? {}) };

  for (const header of Object.keys(headers)) {
    if (CORS_RESPONSE_HEADERS.has(header.toLowerCase())) {
      delete headers[header];
    }
  }

  return headers;
}

function appendVaryHeader(responseHeaders: Record<string, string[]>, values: string[]) {
  const existingHeader = Object.keys(responseHeaders).find((header) => header.toLowerCase() === "vary");
  const existingValues = existingHeader ? responseHeaders[existingHeader] : [];
  const mergedValues = new Set<string>();

  for (const value of existingValues) {
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => mergedValues.add(item));
  }

  values.forEach((value) => mergedValues.add(value));
  responseHeaders[existingHeader ?? "Vary"] = [Array.from(mergedValues).join(", ")];
}

function isAllowedCustomProtocolCorsRequest(targetUrl: string, origin: string | undefined) {
  const targetProtocol = getProtocol(targetUrl);
  if (!targetProtocol || !CUSTOM_PROTOCOLS.has(targetProtocol)) {
    return true;
  }

  if (!origin || origin === "null") {
    return false;
  }

  const originProtocol = getProtocol(origin);
  if (!originProtocol) {
    return false;
  }

  return ALLOWED_ORIGIN_PROTOCOLS_BY_TARGET_PROTOCOL[targetProtocol]?.includes(originProtocol) ?? false;
}

/**
 * Apply a conservative CORS policy for Flow's custom protocols.
 */
export function setupCorsForCustomProtocols(session: Session) {
  const webRequest = createBetterWebRequest(session.webRequest, "custom-protocol-cors");
  const corsRequests = new Map<number, CorsRequestMetadata>();

  webRequest.onBeforeSendHeaders((details, callback) => {
    const targetProtocol = getProtocol(details.url);
    if (!targetProtocol || !CUSTOM_PROTOCOLS.has(targetProtocol)) {
      callback({});
      return;
    }

    const origin = getHeader(details.requestHeaders, "origin");
    if (!origin) {
      callback({});
      return;
    }

    if (!isAllowedCustomProtocolCorsRequest(details.url, origin)) {
      callback({ cancel: true });
      return;
    }

    corsRequests.set(details.id, {
      origin,
      requestedHeaders: getHeader(details.requestHeaders, "access-control-request-headers"),
      requestedMethod: getHeader(details.requestHeaders, "access-control-request-method")
    });

    callback({});
  });

  webRequest.onHeadersReceived((details, callback) => {
    const targetProtocol = getProtocol(details.url);
    if (!targetProtocol || !CUSTOM_PROTOCOLS.has(targetProtocol)) {
      callback({});
      return;
    }

    const corsRequest = corsRequests.get(details.id);
    const responseHeaders = stripCorsResponseHeaders(details.responseHeaders);

    if (corsRequest && isAllowedCustomProtocolCorsRequest(details.url, corsRequest.origin)) {
      responseHeaders["Access-Control-Allow-Origin"] = [corsRequest.origin];
      if (corsRequest.requestedMethod) {
        responseHeaders["Access-Control-Allow-Methods"] = [corsRequest.requestedMethod];
      }
      if (corsRequest.requestedHeaders) {
        responseHeaders["Access-Control-Allow-Headers"] = [corsRequest.requestedHeaders];
      }
      appendVaryHeader(responseHeaders, ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]);
    }

    callback({ responseHeaders });
  });

  const cleanupRequest = (details: { id: number }) => {
    corsRequests.delete(details.id);
  };

  webRequest.onCompleted(cleanupRequest);
  webRequest.onErrorOccurred(cleanupRequest);
  webRequest.onBeforeRedirect(cleanupRequest);
}
