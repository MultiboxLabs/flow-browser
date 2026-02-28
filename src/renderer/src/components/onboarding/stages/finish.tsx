import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Check, Rocket } from "lucide-react";
import { OnboardingAdvanceCallback } from "@/components/onboarding/main";

export function OnboardingFinish({ advance }: { advance: OnboardingAdvanceCallback }) {
  return (
    <>
      {/* Success Icon */}
      <motion.div
        className="relative z-elevated mb-6"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="size-24 rounded-full bg-gradient-to-br from-[#0066FF]/30 to-[#00AAFF]/20 border border-[#0066FF]/40 flex items-center justify-center">
          <Check className="h-12 w-12 text-[#0066FF]" strokeWidth={3} />
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-elevated text-center max-w-2xl px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
      >
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">{"You're All Set"}</h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Flow Browser is ready. You can always adjust these settings later.
        </p>
      </motion.div>

      {/* Button */}
      <div className="mt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <Button
            onClick={advance}
            className="cursor-pointer px-10 py-6 text-lg bg-[#0066FF] hover:bg-[#0055DD] text-white border border-[#0066FF]/50 gap-2"
          >
            Start Browsing
            <Rocket className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </>
  );
}
