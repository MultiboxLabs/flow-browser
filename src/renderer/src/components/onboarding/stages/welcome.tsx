import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function OnboardingWelcome({ advance }: { advance: OnboardingAdvanceCallback }) {
  const [version, setVersion] = useState<string>("0.0.0");
  useEffect(() => {
    flow.app.getAppInfo().then((info) => {
      setVersion(info.app_version);
    });
  }, []);

  return (
    <>
      {/* Logo */}
      <motion.div
        className="relative z-elevated mb-8"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <img src="/assets/icon.png" alt="App Icon" className="size-24 rounded-full" />
      </motion.div>

      {/* Alpha badge */}
      <motion.div
        className="relative z-elevated mb-6 px-4 py-1 border border-[#0066FF]/50 rounded-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <span className="text-[#0066FF] text-sm">{`v${version}`}</span>
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-elevated text-center max-w-2xl px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      >
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Welcome to
          <br />
          Flow Browser
        </h1>
        <p className="text-gray-400 text-xl">Thank you for joining us early on this journey.</p>
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
            Continue
          </Button>
        </motion.div>
      </div>
    </>
  );
}
