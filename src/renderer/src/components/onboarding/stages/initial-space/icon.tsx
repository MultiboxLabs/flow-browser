import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SpaceIconPicker } from "@/components/settings/sections/spaces/icon-picker";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { SpaceIcon } from "@/lib/phosphor-icons";

export function OnboardingSpaceIcon({
  advance,
  profileId,
  spaceId
}: {
  advance: OnboardingAdvanceCallback;
  profileId: string;
  spaceId: string;
}) {
  const [selectedIcon, setSelectedIcon] = useState<string>("Globe");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSpaceData = async () => {
      if (!profileId || !spaceId) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const spaces = await flow.spaces.getSpacesFromProfile(profileId);
        const space = spaces.find((s) => s.id === spaceId);

        if (space && space.icon) {
          setSelectedIcon(space.icon);
        }
      } catch (error) {
        console.error("Failed to load space data:", error);
        setErrorMessage("Couldn't load space data");
      } finally {
        setIsLoading(false);
      }
    };

    loadSpaceData();
  }, [profileId, spaceId]);

  const saveIcon = async () => {
    if (!profileId || !spaceId || isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await flow.spaces.updateSpace(profileId, spaceId, {
        icon: selectedIcon
      });

      setSaveSuccess(true);

      setTimeout(() => {
        advance();
      }, 1000);
    } catch (error) {
      console.error("Failed to save space icon:", error);
      setErrorMessage("Couldn't save space icon. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <motion.div
        className="relative z-elevated text-center max-w-2xl px-4 mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Space Icon</h1>
        <p className="text-gray-400 text-base">Pick a visual identity for your space</p>
      </motion.div>

      <motion.div
        className="relative z-elevated w-full max-w-2xl px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span className="text-white">Loading...</span>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <AlertCircle className="h-10 w-10 text-amber-400 mb-2" />
            <div className="text-white text-lg font-medium mb-1">Something went wrong</div>
            <div className="text-gray-400 max-w-md mb-3">{errorMessage}</div>
            <Button
              onClick={advance}
              className="cursor-pointer px-5 py-1.5 bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-white backdrop-blur-md border border-[#0066FF]/30"
            >
              Skip & Continue
            </Button>
          </div>
        ) : saveSuccess ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <CheckCircle className="h-10 w-10 text-green-400 mb-2" />
            <div className="text-white text-lg font-medium mb-1">Icon Saved!</div>
            <div className="text-gray-400 max-w-md">{"Moving to the next step..."}</div>
          </div>
        ) : (
          <div className="overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start">
              {/* Icon Preview */}
              <div className="flex-shrink-0 flex justify-center w-full md:w-auto">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-16 rounded-full bg-white/10 backdrop-blur-sm grid place-items-center">
                    <SpaceIcon id={selectedIcon} className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-white/60 text-xs">Preview</div>
                </div>
              </div>

              {/* Space Icon Picker */}
              <div className="flex-1 w-full md:w-auto space-y-2">
                <Label className="text-white text-sm">Select an Icon</Label>
                <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                  <SpaceIconPicker selectedIcon={selectedIcon} onSelectIcon={setSelectedIcon} />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <Button
                onClick={saveIcon}
                disabled={isSaving}
                className="cursor-pointer px-6 py-2 bg-[#0066FF] hover:bg-[#0055DD] text-white border border-[#0066FF]/50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Icon"
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Skip button */}
      {!isLoading && !errorMessage && !saveSuccess && (
        <div className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
          >
            <Button onClick={advance} variant="ghost" className="cursor-pointer text-white/50 hover:text-white text-sm">
              Skip
            </Button>
          </motion.div>
        </div>
      )}
    </>
  );
}
