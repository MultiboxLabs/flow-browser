import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IconOption {
  id: string;
  name: string;
  author?: string;
  imageId?: string;
  current?: boolean;
}

export function OnboardingIcon({ advance }: { advance: OnboardingAdvanceCallback }) {
  const [selectedIcon, setSelectedIcon] = useState<string>("");
  const [iconOptions, setIconOptions] = useState<IconOption[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const fetchIcons = async () => {
      setIsLoading(true);
      try {
        // Check if platform supports icon customization
        const supported = await flow.icons.isPlatformSupported();
        setIsSupported(supported);

        if (!supported) {
          // If not supported, just show not supported message
          setIsLoading(false);
          return;
        }

        // Fetch both icons and current icon in parallel
        const [icons, currentIconId] = await Promise.all([flow.icons.getIcons(), flow.icons.getCurrentIcon()]);

        setSelectedIcon(currentIconId);

        // Transform IconData to IconOption format
        const options: IconOption[] = icons.map((icon) => ({
          id: icon.id,
          name: icon.name,
          author: icon.author,
          imageId: icon.image_id,
          current: icon.id === currentIconId
        }));

        setIconOptions(options);
      } catch (error) {
        console.error("Failed to fetch icons:", error);
        // Fallback to empty options if API fails
      } finally {
        setIsLoading(false);
      }
    };

    fetchIcons();
  }, []);

  // Handle icon selection
  const handleIconSelect = async (iconId: string) => {
    if (iconId === selectedIcon || isUpdating) return;

    setIsUpdating(true);
    try {
      const success = await flow.icons.setCurrentIcon(iconId);
      if (success) {
        setSelectedIcon(iconId);
        // Update current status for icons
        setIconOptions((prev) =>
          prev.map((icon) => ({
            ...icon,
            current: icon.id === iconId
          }))
        );
      }
    } catch (error) {
      console.error("Failed to update icon:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      {/* Header */}
      <motion.div
        className="relative z-elevated text-center max-w-2xl px-4 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Choose your icon</h1>
        <p className="text-gray-400 text-lg">Select an icon for your Flow Browser</p>
      </motion.div>

      {/* Icon Grid */}
      <motion.div
        className="relative z-elevated w-full max-w-2xl px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span className="text-white">Loading icons...</span>
            </div>
          </div>
        ) : !isSupported ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <AlertCircle className="h-10 w-10 text-amber-400 mb-3" />
            <div className="text-white text-lg font-medium mb-1">Icon Customization Not Supported</div>
            <div className="text-gray-400 max-w-md">
              {"Your current operating system or environment doesn't support changing the application icon."}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {iconOptions.map((icon) => (
              <motion.div
                key={icon.id}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`remove-app-drag flex items-center bg-white/10 backdrop-blur-md border rounded-md p-3 cursor-pointer ${
                  selectedIcon === icon.id
                    ? "border-[#0066FF] ring-1 ring-[#0066FF]"
                    : "border-white/20 hover:border-white/50"
                } relative overflow-hidden ${isUpdating ? "opacity-70 pointer-events-none" : ""}`}
                onClick={() => handleIconSelect(icon.id)}
              >
                <div className="h-12 w-12 relative mr-3 flex-shrink-0">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {icon.imageId ? (
                      <img
                        src={`flow://asset/icons/${icon.imageId}`}
                        alt={icon.name}
                        className="h-10 w-10 rounded-lg shadow-lg"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-[#0066FF] shadow-lg flex items-center justify-center text-xl font-bold text-white">
                        F
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col justify-center">
                    <h3 className="font-medium text-base truncate text-white">{icon.name}</h3>
                    {icon.author && <p className="text-xs text-gray-400 truncate">by {icon.author}</p>}
                  </div>
                </div>

                {selectedIcon === icon.id && !isUpdating && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-1 right-1 h-5 w-5 bg-[#0066FF] rounded-full flex items-center justify-center shadow-md"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}

                {selectedIcon === icon.id && isUpdating && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-1 right-1 h-5 w-5 bg-[#0066FF] rounded-full flex items-center justify-center shadow-md"
                  >
                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
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
            disabled={isLoading || isUpdating}
          >
            {!isSupported ? "Skip" : isLoading || iconOptions.length === 0 ? "Skip" : "Continue"}
          </Button>
        </motion.div>
      </div>
    </>
  );
}
