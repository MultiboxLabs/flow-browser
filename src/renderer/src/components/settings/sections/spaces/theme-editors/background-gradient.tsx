import { ColorPicker } from "../color-picker";
import { motion } from "motion/react";
import { GalleryVerticalEnd, Shuffle } from "lucide-react";
import { Space } from "~/flow/interfaces/sessions/spaces";
import { useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import { SpaceIcon } from "@/lib/phosphor-icons";

type BackgroundGradientEditor = {
  editedSpace: Space;
  updateEditedSpace: (updates: Partial<Space>) => void;
};

export function BackgroundGradientEditor({ editedSpace, updateEditedSpace }: BackgroundGradientEditor) {
  const [randomiseCount, randomised] = useReducer((count: number) => count + 1, 0);

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

  // Generate aesthetically pleasing random colors for gradient
  const generateRandomColors = () => {
    // Generate colors in HSL for better control over aesthetics
    const hue = Math.floor(Math.random() * 360); // Random base hue
    const saturationStart = 65 + Math.floor(Math.random() * 25); // 65-90%
    const saturationEnd = 65 + Math.floor(Math.random() * 25); // 65-90%
    const lightnessStart = 50 + Math.floor(Math.random() * 20); // 50-70%
    const lightnessEnd = 55 + Math.floor(Math.random() * 15); // 55-70%

    // Create harmonious gradient by using related hues (adjacent or complementary)
    const hueVariation =
      Math.random() > 0.5
        ? 30 + Math.floor(Math.random() * 60) // Adjacent (30-90 degrees apart)
        : 180; // Complementary

    const hueEnd = (hue + hueVariation) % 360;

    // Convert HSL to hex
    const startColor = hslToHex(hue, saturationStart, lightnessStart);
    const endColor = hslToHex(hueEnd, saturationEnd, lightnessEnd);

    // Update both local preview and parent state
    setLocalPreview({ bgStartColor: startColor, bgEndColor: endColor });
    updateEditedSpace({ bgStartColor: startColor, bgEndColor: endColor });

    // Force a re-render of the color pickers
    randomised();
  };

  // Helper to convert HSL to Hex
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Background Gradient</h3>
          <GalleryVerticalEnd className="h-4 w-4 text-muted-foreground" />
        </div>
        <Button variant="outline" size="sm" onClick={generateRandomColors} className="flex items-center gap-1">
          <Shuffle className="h-3.5 w-3.5" />
          Random
        </Button>
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
                <SpaceIcon id={editedSpace.icon} className="size-6 text-white" />
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
            key={`start-${randomiseCount}`}
            defaultColor={localPreview.bgStartColor}
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
            key={`end-${randomiseCount}`}
            defaultColor={localPreview.bgEndColor}
            label="End Color"
            onChange={(color) => handleColorChange("bgEndColor", color)}
          />
        </motion.div>
      </div>
    </div>
  );
}
