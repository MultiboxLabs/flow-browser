import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewTabMode } from "@/lib/flow/interfaces/app/newTab";
import { Loader2 } from "lucide-react";

export function OnboardingNewTab({ advance }: { advance: OnboardingAdvanceCallback }) {
  const [mode, setMode] = useState<NewTabMode>("omnibox");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const currentMode = await flow.newTab.getCurrentNewTabMode();
        setMode(currentMode);
      } catch (error) {
        console.error("Failed to fetch new tab mode:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMode();
  }, []);

  const handleModeChange = async (newMode: NewTabMode) => {
    setIsSaving(true);
    try {
      await flow.newTab.setCurrentNewTabMode(newMode);
      setMode(newMode);
    } catch (error) {
      console.error("Failed to update new tab mode:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Header */}
      <motion.div
        className="relative z-10 text-center max-w-2xl px-4 mt-12 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">New Tab Experience</h1>
        <p className="text-gray-400 text-lg">Choose how you'd like new tabs to open in Flow Browser</p>
      </motion.div>

      {/* New Tab Mode Card */}
      <motion.div
        className="relative z-10 w-full max-w-lg px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <Card className="remove-app-drag bg-white/10 backdrop-blur-md border border-white/20">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 className="h-5 w-5 animate-spin text-white mr-2" />
                <span className="text-white">Loading options...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">New Tab Mode</h3>
                  <p className="text-gray-400 text-sm mb-4">Select how you'd like new tabs to open</p>

                  <Select value={mode} onValueChange={handleModeChange} disabled={isSaving}>
                    <SelectTrigger className="w-full bg-black/20 border-white/20 text-white">
                      <SelectValue placeholder="Select new tab mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="omnibox" className="text-white hover:bg-white/10">
                        Command Palette
                      </SelectItem>
                      <SelectItem value="tab" className="text-white hover:bg-white/10">
                        Page
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <div className="flex flex-col gap-2">
                    {mode === "omnibox" && (
                      <div className="text-sm text-gray-400">
                        Command Palette mode opens an intelligent search bar without going anywhere.
                      </div>
                    )}
                    {mode === "tab" && (
                      <div className="text-sm text-gray-400">
                        Page mode opens a full new tab page with customizable widgets and quick access to your favorite
                        sites.
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex flex-col gap-2">
                    <div className="text-center text-sm text-gray-200">You can change this later in the settings.</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
            disabled={isLoading || isSaving}
          >
            Continue
          </Button>
        </motion.div>
      </div>
    </>
  );
}
