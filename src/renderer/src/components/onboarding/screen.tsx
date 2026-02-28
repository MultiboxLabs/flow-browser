import React from "react";

export function OnboardingScreen({ children }: { children?: React.ReactNode }) {
  return (
    <div className="app-drag select-none relative h-screen w-full overflow-hidden bg-[#050A20] flex flex-col items-center justify-center">
      {/* Set document title */}
      <title>Onboarding | Flow Browser</title>

      {/* Static gradient orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-radial from-[#0066FF]/40 via-[#0066FF]/20 to-transparent blur-[60px] z-[5] pointer-events-none"
        aria-hidden="true"
      />

      <div
        className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-radial from-[#0066FF]/30 via-[#0055DD]/15 to-transparent blur-[70px] z-[5] pointer-events-none"
        aria-hidden="true"
      />

      {/* Container for the actual screen content */}
      <div className="relative z-controls w-full h-full flex flex-col items-center justify-center p-4">
        {/* Render children passed to the component */}
        {children}
      </div>
    </div>
  );
}

// Optional: export default if this is the primary export of the file
export default OnboardingScreen;
