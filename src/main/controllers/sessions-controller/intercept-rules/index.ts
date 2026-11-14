import { setupBetterPdfViewer } from "@/controllers/sessions-controller/intercept-rules/better-pdf-viewer";
import { setupCorsForCustomProtocols } from "@/controllers/sessions-controller/intercept-rules/custom-protocol-cors";
import { setupUserAgentTransformer } from "@/controllers/sessions-controller/intercept-rules/user-agent-transformer";
import type { Session } from "electron";

// Setup intercept rules for the session
export function setupInterceptRules(session: Session) {
  // Transform the User-Agent header
  setupUserAgentTransformer(session);

  // Enforce CORS for Flow's custom protocols
  setupCorsForCustomProtocols(session);

  // Setup redirects required for the better PDF viewer
  setupBetterPdfViewer(session);
}
