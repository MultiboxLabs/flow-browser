import { registerProtocolsWithSession } from "@/browser/utility/protocols";
import { getProfilePath } from "@/sessions/profiles";
import { session, Session } from "electron";

const sessions: Map<string, Session> = new Map();

function createSession(profileId: string) {
  const profileSessionPath = getProfilePath(profileId);
  const profileSession = session.fromPath(profileSessionPath);

  registerProtocolsWithSession(profileSession);
  return profileSession;
}

export function getSession(profileId: string): Session {
  if (!sessions.has(profileId)) {
    const newSession = createSession(profileId);
    sessions.set(profileId, newSession);
  }

  return sessions.get(profileId) as Session;
}
