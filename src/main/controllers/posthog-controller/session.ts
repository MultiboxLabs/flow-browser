/**
 * A per-app-launch session ID used to correlate all PostHog events
 * and exceptions that occur during a single application run.
 */
const sessionId: string = crypto.randomUUID();

export function getSessionId(): string {
  return sessionId;
}
