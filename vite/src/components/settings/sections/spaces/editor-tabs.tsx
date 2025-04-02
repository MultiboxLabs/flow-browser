import { ChangeEvent, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Space } from "@/lib/flow";
import { ColorPicker } from "./color-picker";
import { LucideIconPicker, IconPreview } from "./icon-picker";

// Basic Settings Tab Component
interface BasicSettingsTabProps {
  space: Space;
  editedSpace: Space;
  handleNameChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function BasicSettingsTab({ space, editedSpace, handleNameChange }: BasicSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Basic Information</CardTitle>
        <CardDescription>Manage your space's basic settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="space-name">Space Name</Label>
          <Input id="space-name" value={editedSpace.name} onChange={handleNameChange} placeholder="Enter space name" />
        </div>

        <div className="space-y-2">
          <Label>Space ID</Label>
          <div className="p-2 bg-muted rounded-md text-sm">{space.id}</div>
        </div>

        <div className="space-y-2">
          <Label>Profile ID</Label>
          <div className="p-2 bg-muted rounded-md text-sm">{space.profileId}</div>
        </div>
      </CardContent>
    </Card>
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
    setLocalPreview((prev: { bgStartColor: string; bgEndColor: string }) => ({ ...prev, [colorKey]: newColor }));
    updateEditedSpace({ [colorKey]: newColor });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Theme Settings</CardTitle>
        <CardDescription>Configure your space's appearance preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Background Gradient</h3>
          <div className="grid grid-cols-2 gap-4">
            <ColorPicker
              defaultColor={editedSpace.bgStartColor || "#ffffff"}
              label="Start Color"
              onChange={(color) => handleColorChange("bgStartColor", color)}
            />
            <ColorPicker
              defaultColor={editedSpace.bgEndColor || "#ffffff"}
              label="End Color"
              onChange={(color) => handleColorChange("bgEndColor", color)}
            />
          </div>

          <div
            className="mt-4 h-24 rounded-md shadow-sm overflow-hidden"
            style={{
              background: `linear-gradient(to right, ${localPreview.bgStartColor}, ${localPreview.bgEndColor})`
            }}
          >
            <div className="h-full w-full grid place-items-center backdrop-blur-[1px] bg-white/5">
              {editedSpace.icon && <IconPreview iconId={editedSpace.icon} />}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Space Icon</h3>
          <LucideIconPicker
            selectedIcon={editedSpace.icon || "Globe"}
            onSelectIcon={(iconId) => updateEditedSpace({ icon: iconId })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
