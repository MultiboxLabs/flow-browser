import { ChangeEvent, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { ColorPicker } from "./color-picker";
import { LucideIconPicker, IconPreview } from "./icon-picker";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { Info, Sparkles, GalleryVerticalEnd } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Basic Settings Tab Component
interface BasicSettingsTabProps {
  space: Space;
  editedSpace: Space;
  handleNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function BasicSettingsTab({ space, editedSpace, handleNameChange }: BasicSettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
          </div>
          <CardDescription>Manage your space's basic settings</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Label htmlFor="space-name" className="text-sm font-medium">
              Space Name
            </Label>
            <Input
              id="space-name"
              value={editedSpace.name}
              onChange={handleNameChange}
              placeholder="Enter space name"
              className="transition-all focus-within:ring-1 focus-within:ring-primary"
            />
          </motion.div>

          <Separator className="my-4" />

          <div className="grid grid-cols-2 gap-6">
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Space ID</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Unique identifier for this space</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="p-2.5 bg-muted/60 rounded-md text-sm font-mono text-muted-foreground overflow-hidden text-ellipsis">
                {space.id}
              </div>
            </motion.div>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Profile ID</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Profile this space belongs to</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="p-2.5 bg-muted/60 rounded-md text-sm font-mono text-muted-foreground overflow-hidden text-ellipsis">
                {space.profileId}
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Theme Settings Tab Component
interface ThemeSettingsTabProps {
  editedSpace: Space;
  updateEditedSpace: (updates: Partial<Space>) => void;
}

export function ThemeSettingsTab({ editedSpace, updateEditedSpace }: ThemeSettingsTabProps) {
  // Track changes locally instead of relying on editedSpace to trigger re-renders
  const [localPreview, setLocalPreview] = useState({
    bgStartColor: editedSpace.bgStartColor || "#ffffff",
    bgEndColor: editedSpace.bgEndColor || "#ffffff"
  });

  // Update both local preview and parent state
  const handleColorChange = (colorKey: "bgStartColor" | "bgEndColor", newColor: string) => {
    setLocalPreview((prev) => ({ ...prev, [colorKey]: newColor }));
    updateEditedSpace({ [colorKey]: newColor });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Theme Settings
            </CardTitle>
          </div>
          <CardDescription>Configure your space's appearance preferences</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">Background Gradient</h3>
              <GalleryVerticalEnd className="h-4 w-4 text-muted-foreground" />
            </div>

            <motion.div
              className="rounded-xl overflow-hidden shadow-md mb-6 border border-muted/60"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              style={{
                background: `linear-gradient(to right, ${localPreview.bgStartColor}, ${localPreview.bgEndColor})`
              }}
            >
              <div className="h-32 w-full grid place-items-center backdrop-blur-[1px] bg-white/5">
                {editedSpace.icon && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="size-16 rounded-full bg-background/20 backdrop-blur-sm grid place-items-center shadow-lg">
                      <IconPreview iconId={editedSpace.icon} />
                    </div>
                    <div className="text-white/90 text-xs font-medium px-3 py-1 rounded-full bg-black/20 backdrop-blur-md">
                      {editedSpace.name}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <ColorPicker
                  defaultColor={editedSpace.bgStartColor || "#ffffff"}
                  label="Start Color"
                  onChange={(color) => handleColorChange("bgStartColor", color)}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <ColorPicker
                  defaultColor={editedSpace.bgEndColor || "#ffffff"}
                  label="End Color"
                  onChange={(color) => handleColorChange("bgEndColor", color)}
                />
              </motion.div>
            </div>
          </div>

          <Separator className="my-2" />

          <motion.div
            className="space-y-5 pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <h3 className="text-lg font-medium flex items-center gap-2">Space Icon</h3>
            <LucideIconPicker
              selectedIcon={editedSpace.icon || "Globe"}
              onSelectIcon={(iconId) => updateEditedSpace({ icon: iconId })}
            />
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
