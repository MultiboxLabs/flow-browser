import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import { OnboardingCreateSpace } from "./create";
import { OnboardingSpaceIcon } from "./icon";
import { OnboardingSpaceColors } from "./colors";

export function OnboardingInitialSpace({ advance }: { advance: OnboardingAdvanceCallback }) {
  const [substage, setSubstage] = useState<number>(0);
  const [profileId] = useState<string>("main");
  const [spaceId, setSpaceId] = useState<string>("");

  // Advance to the next substage
  const advanceSubstage = () => {
    if (substage < 2) {
      // We have 3 stages (0, 1, 2)
      setSubstage(substage + 1);
    } else {
      // When all substages are complete, move to the next main stage
      advance();
    }
  };

  // Helper to set the space ID from the first substage
  const setActiveSpaceId = (id: string) => {
    setSpaceId(id);
  };

  useEffect(() => {
    if (substage > 0 && !spaceId) {
      advance();
    }
  }, [substage, spaceId, advance]);

  // If we've somehow gone beyond our substages, advance to the next main stage
  if (substage >= 3) {
    advance();
    return null;
  }

  // Render the appropriate substage with the correct props
  return (
    <AnimatePresence mode="wait" initial={true}>
      {substage === 0 ? (
        <OnboardingCreateSpace
          key={`substage-${substage}`}
          advance={advanceSubstage}
          setActiveSpaceId={setActiveSpaceId}
        />
      ) : substage === 1 ? (
        <OnboardingSpaceIcon
          key={`substage-${substage}`}
          advance={advanceSubstage}
          profileId={profileId}
          spaceId={spaceId}
        />
      ) : (
        <OnboardingSpaceColors
          key={`substage-${substage}`}
          advance={advanceSubstage}
          profileId={profileId}
          spaceId={spaceId}
        />
      )}
    </AnimatePresence>
  );
}
