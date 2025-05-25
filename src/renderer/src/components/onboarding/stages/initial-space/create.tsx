import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import type { Profile } from "~/flow/interfaces/sessions/profiles";

const DEFAULT_SPACE_NAME = "Personal";

export function OnboardingCreateSpace({
  advance,
  setActiveSpaceId
}: {
  advance: OnboardingAdvanceCallback;
  setActiveSpaceId: (id: string) => void;
}) {
  // States for space creation
  const [spaceName, setSpaceName] = useState<string>(DEFAULT_SPACE_NAME);

  // States for profile/system checking
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [createSuccess, setCreateSuccess] = useState<boolean>(false);
  const [mainProfile, setMainProfile] = useState<Profile | null>(null);
  const [hasSpaces, setHasSpaces] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if main profile exists and if it has spaces
  useEffect(() => {
    const checkProfileAndSpaces = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // Fetch all profiles
        const profiles = await flow.profiles.getProfiles();

        // Find the main profile
        const main = profiles.find((p) => p.id === "main") || null;
        setMainProfile(main);

        if (main) {
          // Check if the main profile has spaces
          const spaces = await flow.spaces.getSpacesFromProfile(main.id);
          setHasSpaces(spaces.length > 0);
        }
      } catch (error) {
        console.error("Failed to check profiles and spaces:", error);
        setErrorMessage("Couldn't access profile information");
      } finally {
        setIsLoading(false);
      }
    };

    checkProfileAndSpaces();
  }, []);

  // Create the space in the main profile
  const createSpace = async () => {
    if (!mainProfile || isCreating || createSuccess) return;

    setIsCreating(true);
    setErrorMessage(null);

    try {
      // Create the space with just the name
      const created = await flow.spaces.createSpace(mainProfile.id, spaceName);

      if (created) {
        // Get all spaces to find the one we just created
        const spaces = await flow.spaces.getSpacesFromProfile(mainProfile.id);
        const newSpace = spaces.find((s) => s.name === spaceName);

        if (newSpace) {
          // Save the space ID for the next steps
          setActiveSpaceId(newSpace.id);

          // Show success message
          setCreateSuccess(true);

          // Automatically advance after short delay
          setTimeout(() => {
            advance();
          }, 1000);
        } else {
          setErrorMessage("Space created but couldn't be activated. You can manage spaces later in settings.");
        }
      }
    } catch (error) {
      console.error("Failed to create space:", error);
      setErrorMessage("Couldn't create space. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <motion.div
        className="relative z-10 text-center max-w-2xl px-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Create Your Space</h1>
        <p className="text-gray-400 text-lg">{"Let's start by giving your space a name"}</p>
      </motion.div>

      <motion.div
        className="relative z-10 w-full max-w-2xl px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-56">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span className="text-white">Checking system...</span>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center h-56 text-center">
            <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
            <div className="text-white text-lg font-medium mb-1">Something went wrong</div>
            <div className="text-gray-400 max-w-md mb-4">{errorMessage}</div>
            <Button
              onClick={advance}
              className="remove-app-drag cursor-pointer px-6 py-2 bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-white backdrop-blur-md border border-[#0066FF]/30"
            >
              Skip & Continue
            </Button>
          </div>
        ) : !mainProfile ? (
          <div className="flex flex-col items-center justify-center h-56 text-center">
            <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
            <div className="text-white text-lg font-medium mb-1">Main Profile Not Found</div>
            <div className="text-gray-400 max-w-md mb-4">
              {"We couldn't find the main profile for space creation. You can create spaces later from settings."}
            </div>
            <Button
              onClick={advance}
              className="remove-app-drag cursor-pointer px-6 py-2 bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-white backdrop-blur-md border border-[#0066FF]/30"
            >
              Skip & Continue
            </Button>
          </div>
        ) : hasSpaces ? (
          <div className="flex flex-col items-center justify-center h-56 text-center">
            <CheckCircle className="h-10 w-10 text-green-400 mb-3" />
            <div className="text-white text-lg font-medium mb-1">Spaces Already Set Up</div>
            <div className="text-gray-400 max-w-md mb-4">
              You already have spaces in your main profile. You can manage them in settings.
            </div>
            <Button
              onClick={advance}
              className="remove-app-drag cursor-pointer px-6 py-2 bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-white backdrop-blur-md border border-[#0066FF]/30"
            >
              Continue
            </Button>
          </div>
        ) : createSuccess ? (
          <div className="flex flex-col items-center justify-center h-56 text-center">
            <CheckCircle className="h-10 w-10 text-green-400 mb-3" />
            <div className="text-white text-lg font-medium mb-1">Space Created!</div>
            <div className="text-gray-400 max-w-md mb-4">{"Now let's customize its appearance."}</div>
          </div>
        ) : (
          <div className="overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-6 remove-app-drag">
            {/* Space Name */}
            <div className="space-y-2 mb-6">
              <Label htmlFor="space-name" className="text-white text-sm">
                Space Name
              </Label>
              <Input
                id="space-name"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                className="bg-white/10 border-white/30 text-white"
                placeholder={DEFAULT_SPACE_NAME}
              />
            </div>

            {/* Create Button */}
            <div className="pt-4 flex justify-center">
              <Button
                onClick={createSpace}
                disabled={isCreating || !spaceName.trim()}
                className="remove-app-drag cursor-pointer px-8 py-3 bg-[#0066FF] hover:bg-[#0055DD] text-white backdrop-blur-md border border-[#0066FF]/50"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Space"
                )}
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Bottom skip button - only show when in setup mode and not in error/success states */}
      {!isLoading && !errorMessage && !hasSpaces && !createSuccess && (
        <div className="my-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
          >
            <Button
              onClick={advance}
              variant="ghost"
              className="remove-app-drag cursor-pointer text-white/70 hover:text-white"
            >
              Skip
            </Button>
          </motion.div>
        </div>
      )}
    </>
  );
}
