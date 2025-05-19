import { registerFlowProtocol } from "@/browser/utility/protocols/_protocols/flow";
import { registerFlowExternalProtocol } from "@/browser/utility/protocols/_protocols/flow-external";
import { PATHS } from "@/modules/paths";
import { protocol, Session } from "electron";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "flow-internal",
    privileges: { standard: true, secure: true, bypassCSP: true, codeCache: true, supportFetchAPI: true }
  },
  {
    scheme: "flow",
    privileges: { standard: true, secure: true, bypassCSP: true, codeCache: true, supportFetchAPI: true }
  },
  {
    scheme: "flow-external",
    privileges: { standard: true, secure: true }
  }
]);

export function registerProtocolsWithSession(session: Session) {
  const protocol = session.protocol;
  registerFlowProtocol(protocol);
  registerFlowExternalProtocol(protocol);
}

export function registerPreloadScript(session: Session) {
  session.registerPreloadScript({
    id: "flow-preload",
    type: "frame",
    filePath: PATHS.PRELOAD
  });
}
