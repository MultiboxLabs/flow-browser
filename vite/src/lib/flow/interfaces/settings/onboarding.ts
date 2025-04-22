// API //
export interface FlowOnboardingAPI {
  /**
   * Finishes the onboarding process
   */
  finish: () => void;

  /**
   * Resets the onboarding process
   */
  reset: () => void;
}
