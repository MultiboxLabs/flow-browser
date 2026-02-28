import { OnboardingScreen } from "@/components/onboarding/screen";
import { OnboardingFinish } from "@/components/onboarding/stages/finish";
import { OnboardingIcon } from "@/components/onboarding/stages/icon";
import { OnboardingNewTab } from "@/components/onboarding/stages/new-tab";
import { OnboardingInitialSpace } from "@/components/onboarding/stages/initial-space/main";
import { OnboardingWelcome } from "@/components/onboarding/stages/welcome";
import { AnimatePresence } from "motion/react";
import { useState } from "react";

export type OnboardingAdvanceCallback = () => void;

const stages = [OnboardingWelcome, OnboardingInitialSpace, OnboardingIcon, OnboardingNewTab, OnboardingFinish];

export function OnboardingMain() {
  const [stage, setStage] = useState<number>(0);

  const advance = () => {
    setStage(stage + 1);
  };

  const Stage = stages[stage];
  if (!Stage) {
    flow.onboarding.finish();
  }

  return (
    <OnboardingScreen currentStep={stage} totalSteps={stages.length}>
      <AnimatePresence mode="wait" initial={true}>
        <Stage key={stage} advance={advance} />
      </AnimatePresence>
    </OnboardingScreen>
  );
}
