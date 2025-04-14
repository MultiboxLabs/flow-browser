import { OnboardingAdvanceCallback } from "@/components/onboarding/main";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

type CollapseMode = "icon" | "offcanvas";

export function OnboardingSidebarCollapseMode({ advance }: { advance: OnboardingAdvanceCallback }) {
  const [mode, setMode] = useState<CollapseMode>("icon");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const currentMode = await flow.settings.getSidebarCollapseMode();
        setMode(currentMode);
      } catch (error) {
        console.error("Failed to fetch sidebar collapse mode:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMode();
  }, []);

  const handleModeChange = async (newMode: CollapseMode) => {
    setIsSaving(true);
    try {
      await flow.settings.setSidebarCollapseMode(newMode);
      setMode(newMode);
    } catch (error) {
      console.error("Failed to update sidebar collapse mode:", error);
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
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Sidebar Collapse Mode</h1>
        <p className="text-gray-400 text-lg">Choose how the sidebar should collapse in Flow Browser</p>
      </motion.div>

      {/* Sidebar Collapse Mode Card */}
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
                  <h3 className="text-lg font-medium text-white mb-2">Sidebar Collapse Mode</h3>
                  <p className="text-gray-400 text-sm mb-4">Select how you'd like the sidebar to collapse</p>

                  <Select value={mode} onValueChange={handleModeChange} disabled={isSaving}>
                    <SelectTrigger className="w-full bg-black/20 border-white/20 text-white">
                      <SelectValue placeholder="Select collapse mode" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/20">
                      <SelectItem value="icon" className="text-white hover:bg-white/10">
                        Icon
                      </SelectItem>
                      <SelectItem value="offcanvas" className="text-white hover:bg-white/10">
                        Off-Screen
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <div className="flex flex-col gap-2">
                    {mode === "icon" && (
                      <div className="text-sm text-gray-400">
                        Icon mode collapses the sidebar to just show icons, saving space while keeping navigation
                        accessible.
                      </div>
                    )}
                    {mode === "offcanvas" && (
                      <div className="text-sm text-gray-400">
                        Off-Screen mode completely hides the sidebar until you need it, maximizing your browsing space.
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
