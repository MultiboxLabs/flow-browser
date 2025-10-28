import { registerFlowProtocol } from "./_protocols/flow";
import { registerFlowInternalProtocol } from "./_protocols/flow-internal";
import { registerFlowExternalProtocol } from "./_protocols/flow-external";
import { protocol, Session } from "electron";

export type Protocols = "flow" | "flow-internal" | "flow-external";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "flow",
    privileges: { standard: true, secure: true, bypassCSP: true, codeCache: true, supportFetchAPI: true }
  },
  {
    scheme: "flow-internal",
    privileges: { standard: true, secure: true, bypassCSP: true, codeCache: true, supportFetchAPI: true }
  },
  {
    scheme: "flow-external",
    privileges: { standard: true, secure: true }
  }
]);

// Register protocols for normal sessions
export function registerProtocolsWithSession(session: Session, protocols: Protocols[]) {
  const protocol = session.protocol;

  if (protocols.includes("flow")) {
    registerFlowProtocol(protocol);
  }
  if (protocols.includes("flow-internal")) {
    registerFlowInternalProtocol(protocol);
  }
  if (protocols.includes("flow-external")) {
    registerFlowExternalProtocol(protocol);
  }
}
