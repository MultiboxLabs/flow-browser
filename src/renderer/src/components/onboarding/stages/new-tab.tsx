import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { BasicSettingsCard } from "@/components/settings/sections/general/basic-settings-cards";
import { useSettings } from "@/components/providers/settings-provider";
import { ArrowRight } from "lucide-react";

export function OnboardingNewTab({ advance }: { advance: OnboardingAdvanceCallback }) {
  const card = useSettings().cards.find((card) => card.title === "New Tab Mode");

  if (!card) {
    advance();
    return null;
  }

  return (
    <>
      {/* Header */}
      <motion.div
        className="relative z-elevated text-center max-w-2xl px-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">New Tab Experience</h1>
        <p className="text-gray-400 text-lg">{"Choose how you'd like new tabs to open"}</p>
      </motion.div>

      {/* Settings Card */}
      <motion.div
        className="relative z-elevated w-full max-w-lg px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        <BasicSettingsCard card={card} transparent />
      </motion.div>

      {/* Continue Button */}
      <div className="mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
        >
          <Button
            onClick={advance}
            className="cursor-pointer px-10 py-6 text-lg bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-white backdrop-blur-md border border-[#0066FF]/30 gap-2"
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </>
  );
}
