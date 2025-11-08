import { registerFlowProtocol } from "./_protocols/flow";
import { registerFlowInternalProtocol } from "./_protocols/flow-internal";
import { registerFlowExternalProtocol } from "./_protocols/flow-external";
import { protocol, Session } from "electron";
import type { CustomProtocol } from "./types";

protocol.registerSchemesAsPrivileged([
  {
    scheme: "flow",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: false,
      allowServiceWorkers: false,
      supportFetchAPI: false,
      corsEnabled: true,
      stream: false,
      codeCache: true
    }
  },
  {
    scheme: "flow-internal",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: false,
      allowServiceWorkers: false,
      supportFetchAPI: false,
      corsEnabled: true,
      stream: false,
      codeCache: true
    }
  },
  {
    scheme: "flow-external",
    privileges: {
      standard: true,
      secure: true,
      bypassCSP: false,
      allowServiceWorkers: false,
      supportFetchAPI: false,
      corsEnabled: true,
      stream: true,
      codeCache: true
    }
  }
]);

// Register protocols for normal sessions
export function registerProtocolsWithSession(session: Session, protocols: CustomProtocol[]) {
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
