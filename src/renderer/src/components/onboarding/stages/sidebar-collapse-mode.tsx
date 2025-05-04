import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { BasicSettingsCard } from "@/components/settings/sections/general/basic-settings-cards";
import { OnboardingDragDisabler } from "@/components/onboarding/stages/onboarding-drag-disabler";
import { useSettings } from "@/components/providers/settings-provider";

export function OnboardingSidebarCollapseMode({ advance }: { advance: OnboardingAdvanceCallback }) {
  const card = useSettings().cards.find((card) => card.title === "Sidebar Settings");

  if (!card) {
    return null;
  }

  return (
    <>
      <OnboardingDragDisabler />

      {/* Header */}
      <motion.div
        className="relative z-10 text-center max-w-2xl px-4 mt-12 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Sidebar Settings</h1>
        <p className="text-gray-400 text-lg">{"Choose how the sidebar should behave"}</p>
      </motion.div>

      {/* Sidebar Collapse Mode Card */}
      <motion.div
        className="relative z-10 w-full max-w-lg px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <BasicSettingsCard card={card} transparent />
      </motion.div>

      {/* Continue Button */}
      <div className="my-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        >
          <Button
            onClick={advance}
            className="remove-app-drag cursor-pointer px-12 py-6 text-lg bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-white backdrop-blur-md border border-[#0066FF]/30"
          >
            Continue
          </Button>
        </motion.div>
      </div>
    </>
  );
}
