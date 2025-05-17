import { matchPattern } from "@/browser/utility/match-pattern";
import { debugPrint } from "@/modules/output";
import { Session } from "electron";

import {
  BeforeSendResponse,
  CallbackResponse,
  HeadersReceivedResponse,
  OnBeforeRedirectListenerDetails,
  OnBeforeRequestListenerDetails,
  OnBeforeSendHeadersListenerDetails,
  OnCompletedListenerDetails,
  OnErrorOccurredListenerDetails,
  OnHeadersReceivedListenerDetails,
  OnResponseStartedListenerDetails,
  OnSendHeadersListenerDetails,
  WebRequest,
  WebRequestFilter
} from "electron";

type OnBeforeRedirectListener = (details: OnBeforeRedirectListenerDetails) => void;
type OnBeforeRequestListener = (
  details: OnBeforeRequestListenerDetails,
  callback: (response: CallbackResponse) => void
) => void;
type OnBeforeSendHeadersListener = (
  details: OnBeforeSendHeadersListenerDetails,
  callback: (beforeSendResponse: BeforeSendResponse) => void
) => void;
type OnCompletedListener = (details: OnCompletedListenerDetails) => void;
type OnErrorOccurredListener = (details: OnErrorOccurredListenerDetails) => void;
type OnHeadersReceivedListener = (
  details: OnHeadersReceivedListenerDetails,
  callback: (headersReceivedResponse: HeadersReceivedResponse) => void
) => void;
type OnResponseStartedListener = (details: OnResponseStartedListenerDetails) => void;
type OnSendHeadersListener = (details: OnSendHeadersListenerDetails) => void;

type WebRequestDetails =
  | OnBeforeRedirectListenerDetails
  | OnBeforeRequestListenerDetails
  | OnBeforeSendHeadersListenerDetails
  | OnCompletedListenerDetails
  | OnErrorOccurredListenerDetails
  | OnHeadersReceivedListenerDetails
  | OnResponseStartedListenerDetails
  | OnSendHeadersListenerDetails;

function logInterception(type: string, details: WebRequestDetails) {
  if (details.url.endsWith(".pdf")) {
    debugPrint("WEB_REQUESTS_INTERCEPTION", `${type} interception:`, details);
  }
}

function matchFilter(filter: WebRequestFilter | undefined, details: WebRequestDetails): boolean {
  if (!filter) {
    return true;
  }

  if (filter.types) {
    if (!filter.types.includes(details.resourceType as never)) {
      return false;
    }
  }

  if (filter.excludeUrls) {
    for (const pattern of filter.excludeUrls) {
      if (matchPattern(pattern, details.url)) {
        return false;
      }
    }
  }

  if (filter.urls) {
    for (const pattern of filter.urls) {
      if (matchPattern(pattern, details.url)) {
        return true;
      }
    }
    // If we have URL patterns but none matched, return false
    return false;
  }

  // If we got here, either there were no URL filters or the excludeUrls didn't match
  return true;
}

class UnifiedWebRequest {
  private readonly webRequest: WebRequest;
  private onBeforeRedirectListeners: Map<string, [OnBeforeRedirectListener, WebRequestFilter | undefined]> = new Map();
  private onBeforeRequestListeners: Map<string, [OnBeforeRequestListener, WebRequestFilter | undefined]> = new Map();
  private onBeforeSendHeadersListeners: Map<string, [OnBeforeSendHeadersListener, WebRequestFilter | undefined]> =
    new Map();
  private onCompletedListeners: Map<string, [OnCompletedListener, WebRequestFilter | undefined]> = new Map();
  private onErrorOccurredListeners: Map<string, [OnErrorOccurredListener, WebRequestFilter | undefined]> = new Map();
  private onHeadersReceivedListeners: Map<string, [OnHeadersReceivedListener, WebRequestFilter | undefined]> =
    new Map();
  private onResponseStartedListeners: Map<string, [OnResponseStartedListener, WebRequestFilter | undefined]> =
    new Map();
  private onSendHeadersListeners: Map<string, [OnSendHeadersListener, WebRequestFilter | undefined]> = new Map();

  constructor(webRequest: WebRequest) {
    this.webRequest = webRequest;
    this.setupListeners();
  }

  private setupListeners() {
    // Just handle it like normal
    this.webRequest.onBeforeRedirect((details) => {
      logInterception("onBeforeRedirect", details);

      for (const [listener, filter] of this.onBeforeRedirectListeners.values()) {
        if (!matchFilter(filter, details)) {
          continue;
        }

        listener(details);
      }
    });

    // Handle the first callback that returns a non-empty object
    this.webRequest.onBeforeRequest((details, callback) => {
      logInterception("onBeforeRequest", details);

      const promises: Promise<CallbackResponse>[] = [];

      for (const [listener, filter] of this.onBeforeRequestListeners.values()) {
        if (!matchFilter(filter, details)) {
          continue;
        }

        const { resolve, promise } = Promise.withResolvers<CallbackResponse>();
        const fakeCallback = (response: CallbackResponse) => {
          resolve(response);
        };
        listener(details, fakeCallback);
        promises.push(promise);
      }

      Promise.all(promises).then((responses) => {
        let callbackSent = false;

        for (const response of responses) {
          const keys = Object.keys(response);
          if (keys.length > 0) {
            callback(response);
            callbackSent = true;
            break;
          }
        }

        if (!callbackSent) {
          callback({});
        }
      });
    });

    // Handle all callbacks with values from last callback
    // or cancel the request if any of the callbacks return a cancel object
    this.webRequest.onBeforeSendHeaders(async (details, callback) => {
      logInterception("onBeforeSendHeaders", details);

      let currentRequestHeaders: Record<string, string> = details.requestHeaders;
      let requestHeadersChanged = false;

      for (const [listener, filter] of this.onBeforeSendHeadersListeners.values()) {
        if (!matchFilter(filter, details)) {
          continue;
        }

        const { resolve, promise } = Promise.withResolvers<BeforeSendResponse>();
        const fakeCallback = (response: BeforeSendResponse) => {
          resolve(response);
        };

        const updatedDetails = {
          ...details,
          requestHeaders: currentRequestHeaders
        };

        listener(updatedDetails, fakeCallback);

        const response = await promise;
        if (response.cancel) {
          callback({
            cancel: true
          });
          return;
        } else if (response.requestHeaders) {
          const newRequestHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(response.requestHeaders)) {
            newRequestHeaders[key] = Array.isArray(value) ? value[0] : value;
          }

          currentRequestHeaders = newRequestHeaders;
          requestHeadersChanged = true;
        }
      }

      if (requestHeadersChanged) {
        callback({
          requestHeaders: currentRequestHeaders
        });
      } else {
        callback({});
      }
    });

    this.webRequest.onCompleted((details) => {
      logInterception("onCompleted", details);

      for (const [listener, filter] of this.onCompletedListeners.values()) {
        if (!matchFilter(filter, details)) {
          continue;
        }

        listener(details);
      }
    });

    this.webRequest.onErrorOccurred((details) => {
      logInterception("onErrorOccurred", details);

      for (const [listener, filter] of this.onErrorOccurredListeners.values()) {
        if (!matchFilter(filter, details)) {
          continue;
        }

        listener(details);
      }
    });

    // Handle all callbacks with values from last callback
    // or cancel the request if any of the callbacks return a cancel object
    this.webRequest.onHeadersReceived(async (details, callback) => {
      logInterception("onHeadersReceived", details);

      let currentResponseHeaders: Record<string, string[]> | undefined = details.responseHeaders;
      let responseHeadersChanged = false;

      let currentStatusLine: string | undefined = details.statusLine;
      let statusLineChanged = false;

      for (const [listener, filter] of this.onHeadersReceivedListeners.values()) {
        if (!matchFilter(filter, details)) {
          continue;
        }

        const { resolve, promise } = Promise.withResolvers<HeadersReceivedResponse>();
        const fakeCallback = (response: HeadersReceivedResponse) => {
          resolve(response);
        };

        const updatedDetails = {
          ...details,
          responseHeaders: currentResponseHeaders,
          statusLine: currentStatusLine
        };

        listener(updatedDetails, fakeCallback);

        const response = await promise;
        if (response.cancel) {
          callback({
            cancel: true
          });
          return;
        } else if (response.responseHeaders) {
          const newResponseHeaders: Record<string, string[]> = {};
          for (const [key, value] of Object.entries(response.responseHeaders)) {
            newResponseHeaders[key] = Array.isArray(value) ? value : [value as string];
          }

          currentResponseHeaders = newResponseHeaders;
          responseHeadersChanged = true;
        } else if (response.statusLine !== undefined) {
          currentStatusLine = response.statusLine;
          statusLineChanged = true;
        }
      }

      if (responseHeadersChanged && statusLineChanged) {
        callback({
          responseHeaders: currentResponseHeaders,
          statusLine: currentStatusLine
        });
      } else if (responseHeadersChanged) {
        callback({
          responseHeaders: currentResponseHeaders
        });
      } else if (statusLineChanged) {
        callback({
          statusLine: currentStatusLine
        });
      } else {
        callback({});
      }
    });

    this.webRequest.onResponseStarted((details) => {
      logInterception("onResponseStarted", details);

      for (const [listener, filter] of this.onResponseStartedListeners.values()) {
        if (!matchFilter(filter, details)) {
          continue;
        }

        listener(details);
      }
    });

    this.webRequest.onSendHeaders((details) => {
      logInterception("onSendHeaders", details);

      for (const [listener, filter] of this.onSendHeadersListeners.values()) {
        if (!matchFilter(filter, details)) {
          continue;
        }

        listener(details);
      }
    });
  }

  /**
   * The `listener` will be called with `listener(details)` when a server initiated
   * redirect is about to occur.
   */
  onBeforeRedirect(filter: WebRequestFilter, listener: OnBeforeRedirectListener | null, id?: string): void;
  /**
   * The `listener` will be called with `listener(details)` when a server initiated
   * redirect is about to occur.
   */
  onBeforeRedirect(listener: OnBeforeRedirectListener | null, id?: string): void;

  public onBeforeRedirect(
    filterOrListener: WebRequestFilter | OnBeforeRedirectListener | null,
    listenerOrId?: OnBeforeRedirectListener | string | null,
    id?: string
  ): void {
    const actualId = id ?? (typeof listenerOrId === "string" ? listenerOrId : crypto.randomUUID());

    let filter: WebRequestFilter | undefined = undefined;
    let listener: OnBeforeRedirectListener | null;

    if (typeof filterOrListener === "function" || filterOrListener === null) {
      // First overload: (listener, id?)
      listener = filterOrListener;
    } else {
      // Second overload: (filter, listener, id?)
      filter = filterOrListener;
      listener = typeof listenerOrId === "function" || listenerOrId === null ? listenerOrId : null;
    }

    if (listener) {
      debugPrint("WEB_REQUESTS", `Adding onBeforeRedirect listener with ID: ${actualId}`);
      this.onBeforeRedirectListeners.set(actualId, [listener, filter]);
    } else {
      debugPrint("WEB_REQUESTS", `Removing onBeforeRedirect listener with ID: ${actualId}`);
      this.onBeforeRedirectListeners.delete(actualId);
    }
  }

  /**
   * The `listener` will be called with `listener(details, callback)` when a request
   * is about to occur.
   *
   * The `uploadData` is an array of `UploadData` objects.
   *
   * The `callback` has to be called with an `response` object.
   *
   * Some examples of valid `urls`:
   */
  onBeforeRequest(filter: WebRequestFilter, listener: OnBeforeRequestListener | null, id?: string): void;
  /**
   * The `listener` will be called with `listener(details, callback)` when a request
   * is about to occur.
   *
   * The `uploadData` is an array of `UploadData` objects.
   *
   * The `callback` has to be called with an `response` object.
   *
   * Some examples of valid `urls`:
   */
  onBeforeRequest(listener: OnBeforeRequestListener | null, id?: string): void;
  public onBeforeRequest(
    filterOrListener: WebRequestFilter | OnBeforeRequestListener | null,
    listenerOrId?: OnBeforeRequestListener | string | null,
    id?: string
  ): void {
    const actualId = id ?? (typeof listenerOrId === "string" ? listenerOrId : crypto.randomUUID());

    let filter: WebRequestFilter | undefined = undefined;
    let listener: OnBeforeRequestListener | null;

    if (typeof filterOrListener === "function" || filterOrListener === null) {
      // First overload: (listener, id?)
      listener = filterOrListener;
    } else {
      // Second overload: (filter, listener, id?)
      filter = filterOrListener;
      listener = typeof listenerOrId === "function" || listenerOrId === null ? listenerOrId : null;
    }

    if (listener) {
      debugPrint("WEB_REQUESTS", `Adding onBeforeRequest listener with ID: ${actualId}`);
      this.onBeforeRequestListeners.set(actualId, [listener, filter]);
    } else {
      debugPrint("WEB_REQUESTS", `Removing onBeforeRequest listener with ID: ${actualId}`);
      this.onBeforeRequestListeners.delete(actualId);
    }
  }

  /**
   * The `listener` will be called with `listener(details, callback)` before sending
   * an HTTP request, once the request headers are available. This may occur after a
   * TCP connection is made to the server, but before any http data is sent.
   *
   * The `callback` has to be called with a `response` object.
   */
  onBeforeSendHeaders(filter: WebRequestFilter, listener: OnBeforeSendHeadersListener | null, id?: string): void;
  /**
   * The `listener` will be called with `listener(details, callback)` before sending
   * an HTTP request, once the request headers are available. This may occur after a
   * TCP connection is made to the server, but before any http data is sent.
   *
   * The `callback` has to be called with a `response` object.
   */
  onBeforeSendHeaders(listener: OnBeforeSendHeadersListener | null, id?: string): void;
  public onBeforeSendHeaders(
    filterOrListener: WebRequestFilter | OnBeforeSendHeadersListener | null,
    listenerOrId?: OnBeforeSendHeadersListener | string | null,
    id?: string
  ): void {
    const actualId = id ?? (typeof listenerOrId === "string" ? listenerOrId : crypto.randomUUID());

    let filter: WebRequestFilter | undefined = undefined;
    let listener: OnBeforeSendHeadersListener | null;

    if (typeof filterOrListener === "function" || filterOrListener === null) {
      listener = filterOrListener;
    } else {
      filter = filterOrListener;
      listener = typeof listenerOrId === "function" || listenerOrId === null ? listenerOrId : null;
    }

    if (listener) {
      debugPrint("WEB_REQUESTS", `Adding onBeforeSendHeaders listener with ID: ${actualId}`);
      this.onBeforeSendHeadersListeners.set(actualId, [listener, filter]);
    } else {
      debugPrint("WEB_REQUESTS", `Removing onBeforeSendHeaders listener with ID: ${actualId}`);
      this.onBeforeSendHeadersListeners.delete(actualId);
    }
  }

  /**
   * The `listener` will be called with `listener(details)` when a request is
   * completed.
   */
  onCompleted(filter: WebRequestFilter, listener: OnCompletedListener | null, id?: string): void;
  /**
   * The `listener` will be called with `listener(details)` when a request is
   * completed.
   */
  onCompleted(listener: OnCompletedListener | null, id?: string): void;
  public onCompleted(
    filterOrListener: WebRequestFilter | OnCompletedListener | null,
    listenerOrId?: OnCompletedListener | string | null,
    id?: string
  ): void {
    const actualId = id ?? (typeof listenerOrId === "string" ? listenerOrId : crypto.randomUUID());

    let filter: WebRequestFilter | undefined = undefined;
    let listener: OnCompletedListener | null;

    if (typeof filterOrListener === "function" || filterOrListener === null) {
      listener = filterOrListener;
    } else {
      filter = filterOrListener;
      listener = typeof listenerOrId === "function" || listenerOrId === null ? listenerOrId : null;
    }

    if (listener) {
      debugPrint("WEB_REQUESTS", `Adding onCompleted listener with ID: ${actualId}`);
      this.onCompletedListeners.set(actualId, [listener, filter]);
    } else {
      debugPrint("WEB_REQUESTS", `Removing onCompleted listener with ID: ${actualId}`);
      this.onCompletedListeners.delete(actualId);
    }
  }

  /**
   * The `listener` will be called with `listener(details)` when an error occurs.
   */
  onErrorOccurred(filter: WebRequestFilter, listener: OnErrorOccurredListener | null, id?: string): void;
  /**
   * The `listener` will be called with `listener(details)` when an error occurs.
   */
  onErrorOccurred(listener: OnErrorOccurredListener | null, id?: string): void;
  public onErrorOccurred(
    filterOrListener: WebRequestFilter | OnErrorOccurredListener | null,
    listenerOrId?: OnErrorOccurredListener | string | null,
    id?: string
  ): void {
    const actualId = id ?? (typeof listenerOrId === "string" ? listenerOrId : crypto.randomUUID());

    let filter: WebRequestFilter | undefined = undefined;
    let listener: OnErrorOccurredListener | null;

    if (typeof filterOrListener === "function" || filterOrListener === null) {
      listener = filterOrListener;
    } else {
      filter = filterOrListener;
      listener = typeof listenerOrId === "function" || listenerOrId === null ? listenerOrId : null;
    }

    if (listener) {
      debugPrint("WEB_REQUESTS", `Adding onErrorOccurred listener with ID: ${actualId}`);
      this.onErrorOccurredListeners.set(actualId, [listener, filter]);
    } else {
      debugPrint("WEB_REQUESTS", `Removing onErrorOccurred listener with ID: ${actualId}`);
      this.onErrorOccurredListeners.delete(actualId);
    }
  }

  /**
   * The `listener` will be called with `listener(details, callback)` when HTTP
   * response headers of a request have been received.
   *
   * The `callback` has to be called with a `response` object.
   */
  onHeadersReceived(filter: WebRequestFilter, listener: OnHeadersReceivedListener | null, id?: string): void;
  /**
   * The `listener` will be called with `listener(details, callback)` when HTTP
   * response headers of a request have been received.
   *
   * The `callback` has to be called with a `response` object.
   */
  onHeadersReceived(listener: OnHeadersReceivedListener | null, id?: string): void;
  public onHeadersReceived(
    filterOrListener: WebRequestFilter | OnHeadersReceivedListener | null,
    listenerOrId?: OnHeadersReceivedListener | string | null,
    id?: string
  ): void {
    const actualId = id ?? (typeof listenerOrId === "string" ? listenerOrId : crypto.randomUUID());

    let filter: WebRequestFilter | undefined = undefined;
    let listener: OnHeadersReceivedListener | null;

    if (typeof filterOrListener === "function" || filterOrListener === null) {
      listener = filterOrListener;
    } else {
      filter = filterOrListener;
      listener = typeof listenerOrId === "function" || listenerOrId === null ? listenerOrId : null;
    }

    if (listener) {
      debugPrint("WEB_REQUESTS", `Adding onHeadersReceived listener with ID: ${actualId}`);
      this.onHeadersReceivedListeners.set(actualId, [listener, filter]);
    } else {
      debugPrint("WEB_REQUESTS", `Removing onHeadersReceived listener with ID: ${actualId}`);
      this.onHeadersReceivedListeners.delete(actualId);
    }
  }

  /**
   * The `listener` will be called with `listener(details)` when first byte of the
   * response body is received. For HTTP requests, this means that the status line
   * and response headers are available.
   */
  onResponseStarted(filter: WebRequestFilter, listener: OnResponseStartedListener | null, id?: string): void;
  /**
   * The `listener` will be called with `listener(details)` when first byte of the
   * response body is received. For HTTP requests, this means that the status line
   * and response headers are available.
   */
  onResponseStarted(listener: OnResponseStartedListener | null, id?: string): void;
  public onResponseStarted(
    filterOrListener: WebRequestFilter | OnResponseStartedListener | null,
    listenerOrId?: OnResponseStartedListener | string | null,
    id?: string
  ): void {
    const actualId = id ?? (typeof listenerOrId === "string" ? listenerOrId : crypto.randomUUID());

    let filter: WebRequestFilter | undefined = undefined;
    let listener: OnResponseStartedListener | null;

    if (typeof filterOrListener === "function" || filterOrListener === null) {
      listener = filterOrListener;
    } else {
      filter = filterOrListener;
      listener = typeof listenerOrId === "function" || listenerOrId === null ? listenerOrId : null;
    }

    if (listener) {
      debugPrint("WEB_REQUESTS", `Adding onResponseStarted listener with ID: ${actualId}`);
      this.onResponseStartedListeners.set(actualId, [listener, filter]);
    } else {
      debugPrint("WEB_REQUESTS", `Removing onResponseStarted listener with ID: ${actualId}`);
      this.onResponseStartedListeners.delete(actualId);
    }
  }

  /**
   * The `listener` will be called with `listener(details)` just before a request is
   * going to be sent to the server, modifications of previous `onBeforeSendHeaders`
   * response are visible by the time this listener is fired.
   */
  onSendHeaders(filter: WebRequestFilter, listener: OnSendHeadersListener | null, id?: string): void;
  /**
   * The `listener` will be called with `listener(details)` just before a request is
   * going to be sent to the server, modifications of previous `onBeforeSendHeaders`
   * response are visible by the time this listener is fired.
   */
  onSendHeaders(listener: OnSendHeadersListener | null, id?: string): void;
  public onSendHeaders(
    filterOrListener: WebRequestFilter | OnSendHeadersListener | null,
    listenerOrId?: OnSendHeadersListener | string | null,
    id?: string
  ): void {
    const actualId = id ?? (typeof listenerOrId === "string" ? listenerOrId : crypto.randomUUID());

    let filter: WebRequestFilter | undefined = undefined;
    let listener: OnSendHeadersListener | null;

    if (typeof filterOrListener === "function" || filterOrListener === null) {
      listener = filterOrListener;
    } else {
      filter = filterOrListener;
      listener = typeof listenerOrId === "function" || listenerOrId === null ? listenerOrId : null;
    }

    if (listener) {
      debugPrint("WEB_REQUESTS", `Adding onSendHeaders listener with ID: ${actualId}`);
      this.onSendHeadersListeners.set(actualId, [listener, filter]);
    } else {
      debugPrint("WEB_REQUESTS", `Removing onSendHeaders listener with ID: ${actualId}`);
      this.onSendHeadersListeners.delete(actualId);
    }
  }
}

const unifiedWebRequestsMap = new Map<WebRequest, UnifiedWebRequest>();

export function getUnifiedWebRequest(webRequest: WebRequest): UnifiedWebRequest {
  if (unifiedWebRequestsMap.has(webRequest)) {
    return unifiedWebRequestsMap.get(webRequest)!;
  }

  const unifiedWebRequest = new UnifiedWebRequest(webRequest);
  unifiedWebRequestsMap.set(webRequest, unifiedWebRequest);

  return unifiedWebRequest;
}

// Use WeakMaps to generate unique identifiers for objects
const objectIds = new WeakMap<object, string>();
let nextObjectId = 0;

function getObjectId(obj: object): string {
  if (!objectIds.has(obj)) {
    objectIds.set(obj, (nextObjectId++).toString());
  }
  return objectIds.get(obj)!;
}

// Cache for betterWebRequest instances
const betterWebRequestCache = new Map<string, WebRequest>();

export function createBetterWebRequest(webRequest: WebRequest, id?: string): WebRequest {
  const actualId = id ?? crypto.randomUUID();
  const webRequestId = getObjectId(webRequest);
  const cacheKey = `${webRequestId}_${actualId}`;

  // Check if we already have a cached instance
  if (betterWebRequestCache.has(cacheKey)) {
    return betterWebRequestCache.get(cacheKey)!;
  }

  const unifiedWebRequest = getUnifiedWebRequest(webRequest);

  // Fix ESLint 'any' type warnings by using explicit type unions
  type ListenerOrFilter<L> = WebRequestFilter | L | null;

  // We need to use a simpler approach with specific functions
  const betterWebRequest: WebRequest = {
    // Using special functions that bind the ID but maintain the overload signatures
    onBeforeRedirect: function (
      filterOrListener: ListenerOrFilter<OnBeforeRedirectListener>,
      listener?: OnBeforeRedirectListener | null
    ) {
      // First overload signature: onBeforeRedirect(listener)
      if (typeof filterOrListener === "function" || filterOrListener === null) {
        return unifiedWebRequest.onBeforeRedirect(filterOrListener, actualId);
      }
      // Second overload signature: onBeforeRedirect(filter, listener)
      return unifiedWebRequest.onBeforeRedirect(filterOrListener, listener || null, actualId);
    } as WebRequest["onBeforeRedirect"],

    onBeforeRequest: function (
      filterOrListener: ListenerOrFilter<OnBeforeRequestListener>,
      listener?: OnBeforeRequestListener | null
    ) {
      if (typeof filterOrListener === "function" || filterOrListener === null) {
        return unifiedWebRequest.onBeforeRequest(filterOrListener, actualId);
      }
      return unifiedWebRequest.onBeforeRequest(filterOrListener, listener || null, actualId);
    } as WebRequest["onBeforeRequest"],

    onBeforeSendHeaders: function (
      filterOrListener: ListenerOrFilter<OnBeforeSendHeadersListener>,
      listener?: OnBeforeSendHeadersListener | null
    ) {
      if (typeof filterOrListener === "function" || filterOrListener === null) {
        return unifiedWebRequest.onBeforeSendHeaders(filterOrListener, actualId);
      }
      return unifiedWebRequest.onBeforeSendHeaders(filterOrListener, listener || null, actualId);
    } as WebRequest["onBeforeSendHeaders"],

    onCompleted: function (
      filterOrListener: ListenerOrFilter<OnCompletedListener>,
      listener?: OnCompletedListener | null
    ) {
      if (typeof filterOrListener === "function" || filterOrListener === null) {
        return unifiedWebRequest.onCompleted(filterOrListener, actualId);
      }
      return unifiedWebRequest.onCompleted(filterOrListener, listener || null, actualId);
    } as WebRequest["onCompleted"],

    onErrorOccurred: function (
      filterOrListener: ListenerOrFilter<OnErrorOccurredListener>,
      listener?: OnErrorOccurredListener | null
    ) {
      if (typeof filterOrListener === "function" || filterOrListener === null) {
        return unifiedWebRequest.onErrorOccurred(filterOrListener, actualId);
      }
      return unifiedWebRequest.onErrorOccurred(filterOrListener, listener || null, actualId);
    } as WebRequest["onErrorOccurred"],

    onHeadersReceived: function (
      filterOrListener: ListenerOrFilter<OnHeadersReceivedListener>,
      listener?: OnHeadersReceivedListener | null
    ) {
      if (typeof filterOrListener === "function" || filterOrListener === null) {
        return unifiedWebRequest.onHeadersReceived(filterOrListener, actualId);
      }
      return unifiedWebRequest.onHeadersReceived(filterOrListener, listener || null, actualId);
    } as WebRequest["onHeadersReceived"],

    onResponseStarted: function (
      filterOrListener: ListenerOrFilter<OnResponseStartedListener>,
      listener?: OnResponseStartedListener | null
    ) {
      if (typeof filterOrListener === "function" || filterOrListener === null) {
        return unifiedWebRequest.onResponseStarted(filterOrListener, actualId);
      }
      return unifiedWebRequest.onResponseStarted(filterOrListener, listener || null, actualId);
    } as WebRequest["onResponseStarted"],

    onSendHeaders: function (
      filterOrListener: ListenerOrFilter<OnSendHeadersListener>,
      listener?: OnSendHeadersListener | null
    ) {
      if (typeof filterOrListener === "function" || filterOrListener === null) {
        return unifiedWebRequest.onSendHeaders(filterOrListener, actualId);
      }
      return unifiedWebRequest.onSendHeaders(filterOrListener, listener || null, actualId);
    } as WebRequest["onSendHeaders"]
  };

  // Store in cache
  betterWebRequestCache.set(cacheKey, betterWebRequest);

  return betterWebRequest;
}

// Cache for betterSession instances
const betterSessionCache = new Map<string, Session>();

export function createBetterSession(session: Session, id?: string): Session {
  const actualId = id ?? crypto.randomUUID();
  const sessionId = getObjectId(session);
  const cacheKey = `${sessionId}_${actualId}`;

  // Check if we already have a cached instance
  if (betterSessionCache.has(cacheKey)) {
    return betterSessionCache.get(cacheKey)!;
  }

  const webRequest = session.webRequest;
  const betterWebRequest = createBetterWebRequest(webRequest, actualId);

  // Create a proxy to intercept property access
  const betterSession = new Proxy(session, {
    get(target, prop, receiver) {
      // When webRequest is accessed, return our enhanced version
      if (prop === "webRequest") {
        debugPrint("WEB_REQUESTS", "webRequest property accessed");
        return betterWebRequest;
      }

      // For all other properties, pass through to the original session
      const value = Reflect.get(target, prop, receiver);

      // If the property is a method, bind it to the original session
      if (typeof value === "function") {
        return value.bind(target);
      }

      return value;
    }
  });

  // Store in cache
  betterSessionCache.set(cacheKey, betterSession);

  return betterSession;
}
