import React from "react";

export function OnboardingScreen({
  children,
  currentStep,
  totalSteps
}: {
  children?: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
}) {
  return (
    <div className="select-none relative h-screen w-full overflow-hidden bg-[#050A20] flex flex-col">
      <title>Onboarding | Flow Browser</title>

      {/* Draggable topbar region */}
      <div className="app-drag w-full h-10 shrink-0 flex items-center justify-center relative z-modal">
        {currentStep !== undefined && totalSteps !== undefined && totalSteps > 0 && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i < currentStep ? "w-5 bg-[#0066FF]" : i === currentStep ? "w-5 bg-[#0066FF]/70" : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Static gradient orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-radial from-[#0066FF]/40 via-[#0066FF]/20 to-transparent blur-[60px] z-[5] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-radial from-[#0066FF]/30 via-[#0055DD]/15 to-transparent blur-[70px] z-[5] pointer-events-none"
        aria-hidden="true"
      />

      {/* Content area */}
      <div className="relative z-controls w-full flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export default OnboardingScreen;
