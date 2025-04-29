import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { Palette } from "lucide-react";

// ==============================
// ColorPicker Component
// ==============================
interface ColorPickerProps {
  defaultColor: string;
  label: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ defaultColor, label, onChange }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewColor, setPreviewColor] = useState(defaultColor || "#ffffff");
  const [isFocused, setIsFocused] = useState(false);

  const colorChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle color change without re-rendering on every input
  const handleColorChange = () => {
    if (colorChangeTimeoutRef.current) {
      clearTimeout(colorChangeTimeoutRef.current);
    }

    if (inputRef.current) {
      const newColor = inputRef.current.value;

      colorChangeTimeoutRef.current = setTimeout(() => {
        setPreviewColor(newColor);
        onChange(newColor);
      }, 100);
    }
  };

  // Update preview color without triggering re-renders in parent
  const handlePreviewUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewColor(e.target.value);
  };

  // Only call onChange when focus is lost (user is done selecting)
  const handleBlur = () => {
    setIsFocused(false);
    if (inputRef.current) {
      onChange(inputRef.current.value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Get contrasting text color for the preview
  const getContrastingTextColor = (hexColor: string) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? "#000000" : "#ffffff";
  };

  const textColor = getContrastingTextColor(previewColor);

  return (
    <div className="space-y-2.5">
      <Label
        htmlFor={`color-picker-${label.toLowerCase().replace(/\s+/g, "-")}`}
        className="text-sm font-medium flex items-center gap-1.5"
      >
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      <div className="flex items-center gap-3">
        <motion.div
          className="h-10 w-10 rounded-lg shadow-sm flex-shrink-0 relative overflow-hidden"
          style={{ backgroundColor: previewColor }}
          animate={{
            scale: isFocused ? 1.05 : 1,
            boxShadow: isFocused ? "0 0 0 2px rgba(255,255,255,0.1), 0 0 0 4px " + previewColor + "60" : "none"
          }}
          transition={{ duration: 0.2 }}
        >
          <div
            className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
            style={{ opacity: isFocused ? 0.2 : 0 }}
          />
        </motion.div>
        <div className="relative w-full">
          <input
            id={`color-picker-${label.toLowerCase().replace(/\s+/g, "-")}`}
            ref={inputRef}
            type="color"
            defaultValue={defaultColor || "#ffffff"}
            onChange={handlePreviewUpdate}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onInput={handleColorChange}
            className="h-10 w-full rounded-lg border cursor-pointer absolute inset-0 opacity-0 z-10"
          />
          <motion.div
            className="h-10 w-full rounded-lg border bg-background px-3 flex items-center text-sm shadow-xs cursor-pointer overflow-hidden"
            animate={{
              borderColor: isFocused ? previewColor : "rgb(var(--border))",
              borderWidth: isFocused ? "1.5px" : "1px"
            }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between w-full">
              <span>{previewColor.toUpperCase()}</span>
              <motion.div
                className="flex items-center justify-center h-6 px-2 rounded-md text-xs font-medium"
                animate={{
                  backgroundColor: isFocused ? previewColor : "transparent",
                  color: isFocused ? textColor : "inherit"
                }}
                transition={{ duration: 0.2 }}
              >
                {isFocused ? "Selecting" : "Change"}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
