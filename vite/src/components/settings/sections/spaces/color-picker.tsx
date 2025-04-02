import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";

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
    if (inputRef.current) {
      onChange(inputRef.current.value);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`color-picker-${label.toLowerCase().replace(/\s+/g, "-")}`}>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md border shadow-sm flex-shrink-0" style={{ backgroundColor: previewColor }} />
        <div className="relative w-full">
          <input
            id={`color-picker-${label.toLowerCase().replace(/\s+/g, "-")}`}
            ref={inputRef}
            type="color"
            defaultValue={defaultColor || "#ffffff"}
            onChange={handlePreviewUpdate}
            onBlur={handleBlur}
            onInput={handleColorChange}
            className="h-9 w-full rounded-md border cursor-pointer absolute inset-0 opacity-0"
          />
          <div className="h-9 w-full rounded-md border bg-background px-3 py-1 flex items-center text-sm shadow-xs cursor-pointer">
            {previewColor.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
