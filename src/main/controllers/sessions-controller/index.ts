import { profilesController } from "@/controllers/profiles-controller";
import { session, Session } from "electron";
import { defaultSessionReady, isDefaultSessionReady } from "./default-session";
import { registerHandlersWithSession } from "./handlers";
import { setupInterceptRules } from "./intercept-rules";
import { registerPreloadScripts } from "./preload-scripts";
import { registerProtocolsWithSession } from "./protocols";
import { createBetterWebRequest, createBetterSession } from "./web-requests";

class SessionsController {
  private sessions: Map<string, Session> = new Map();

  constructor() {
    this.sessions = new Map();
  }

  // Profile Sessions //
  private _create(profileId: string): Session {
    // Create Session
    const profileSessionPath = profilesController.getProfilePath(profileId);
    const profileSession = session.fromPath(profileSessionPath);

    // Register protocols and callbacks
    registerProtocolsWithSession(profileSession, ["flow", "flow-external"]);
    registerHandlersWithSession(profileSession);

    // Register Preload Script and Network Intercept Rules
    registerPreloadScripts(profileSession);
    setupInterceptRules(profileSession);

    // Store session in map and return
    this.sessions.set(profileId, profileSession);
    return profileSession;
  }

  public getIfExists(profileId: string): Session | undefined {
    return this.sessions.get(profileId);
  }

  public get(profileId: string): Session {
    const existingSession = this.getIfExists(profileId);
    if (existingSession) {
      return existingSession;
    }

    // Create session stores it in the map automatically
    return this._create(profileId);
  }

  // Default Session //
  public isDefaultSessionReady(): boolean {
    return isDefaultSessionReady;
  }
  public whenDefaultSessionReady(): Promise<void> {
    return defaultSessionReady;
  }
}

export const sessionsController = new SessionsController();

export const unifiedWebRequests = {
  create: createBetterWebRequest,
  createSession: createBetterSession
} as const;
