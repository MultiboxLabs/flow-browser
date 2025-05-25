import { ChangeEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import { motion } from "motion/react";
import { Separator } from "@/components/ui/separator";
import { Info, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BackgroundGradientEditor } from "@/components/settings/sections/spaces/theme-editors/background-gradient";
import { SpaceIconEditor } from "@/components/settings/sections/spaces/theme-editors/space-icon";

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
          <CardDescription>{"Manage your space's basic settings"}</CardDescription>
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
          <CardDescription>{"Configure your space's appearance preferences"}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          <BackgroundGradientEditor editedSpace={editedSpace} updateEditedSpace={updateEditedSpace} />

          <Separator className="my-2" />

          <SpaceIconEditor editedSpace={editedSpace} updateEditedSpace={updateEditedSpace} />
        </CardContent>
      </Card>
    </motion.div>
  );
}
