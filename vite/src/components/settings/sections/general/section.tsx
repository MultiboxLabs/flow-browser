import { ResetOnboardingCard } from "@/components/settings/sections/general/reset-onboarding-card";
import { NewTabModeCard } from "./new-tab-mode-card";

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">General</h2>
        <p className="text-muted-foreground">Manage your browser's general settings</p>
      </div>

      <NewTabModeCard />
      <ResetOnboardingCard />
    </div>
  );
}
