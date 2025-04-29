import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { OnboardingAdvanceCallback } from "@/components/onboarding/main";

export function OnboardingFinish({ advance }: { advance: OnboardingAdvanceCallback }) {
  return (
    <>
      {/* Success Icon */}
      <motion.div
        className="relative z-10 mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="size-24 rounded-full bg-[#0066FF]/20 border border-[#0066FF]/50 flex items-center justify-center">
          <Check className="h-12 w-12 text-[#0066FF]" />
        </div>
      </motion.div>

      {/* Ready Badge */}
      <motion.div
        className="relative z-10 mb-6 px-4 py-1 border border-green-500/50 rounded-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <span className="text-green-400 text-sm">All Set!</span>
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-2xl px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">{"You're Ready!"}</h1>
        <p className="text-gray-400 text-xl">Your Flow Browser is now set up and ready to use.</p>
      </motion.div>

      {/* Button */}
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
            Finish
          </Button>
        </motion.div>
      </div>
    </>
  );
}
