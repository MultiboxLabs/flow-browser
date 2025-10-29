import { setupBetterPdfViewer } from "@/controllers/sessions-controller/intercept-rules/better-pdf-viewer";
import { setupCorsBypassForCustomProtocols } from "@/controllers/sessions-controller/intercept-rules/cors-bypass-custom-protocols";
import { setupUserAgentTransformer } from "@/controllers/sessions-controller/intercept-rules/user-agent-transformer";
import type { Session } from "electron";

// Setup intercept rules for the session
export function setupInterceptRules(session: Session) {
  // Transform the User-Agent header
  setupUserAgentTransformer(session);

  // Bypass CORS for flow and flow-internal protocols
  setupCorsBypassForCustomProtocols(session);

  // Setup redirects required for the better PDF viewer
  setupBetterPdfViewer(session);
}
