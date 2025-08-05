import { useRef, useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Edit3, Check, X, Pipette } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// ==============================
// ColorPicker Component
// ==============================
interface ColorPickerProps {
  defaultColor: string;
  label: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ defaultColor, label, onChange }: ColorPickerProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [previewColor, setPreviewColor] = useState(defaultColor || "#ffffff");
  const [textValue, setTextValue] = useState(defaultColor || "#ffffff");
  const [isFocused, setIsFocused] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [validationError, setValidationError] = useState("");

  const colorChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync text value when defaultColor changes (for randomize functionality)
  useEffect(() => {
    setTextValue(defaultColor || "#ffffff");
    setPreviewColor(defaultColor || "#ffffff");
  }, [defaultColor]);

  // Validate hex color format
  const isValidHexColor = (hex: string): boolean => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(hex);
  };

  // Normalize hex color (convert 3-digit to 6-digit)
  const normalizeHexColor = (hex: string): string => {
    if (hex.length === 4) {
      // Convert #rgb to #rrggbb
      return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex;
  };

  // Handle color picker change
  const handleColorPickerChange = () => {
    if (colorChangeTimeoutRef.current) {
      clearTimeout(colorChangeTimeoutRef.current);
    }

    if (colorInputRef.current) {
      const newColor = colorInputRef.current.value;
      setPreviewColor(newColor);
      setTextValue(newColor);
      setValidationError("");

      colorChangeTimeoutRef.current = setTimeout(() => {
        onChange(newColor);
      }, 100);
    }
  };

  // Handle color picker preview update
  const handleColorPickerPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPreviewColor(e.target.value);
    setTextValue(e.target.value);
  };

  // Handle text input change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTextValue(value);

    // Clear previous validation error
    setValidationError("");

    // Add # if not present and value is not empty
    let normalizedValue = value;
    if (value && !value.startsWith("#")) {
      normalizedValue = "#" + value;
      setTextValue(normalizedValue);
    }

    // Validate and update if valid
    if (normalizedValue && isValidHexColor(normalizedValue)) {
      const finalColor = normalizeHexColor(normalizedValue);
      setPreviewColor(finalColor);
      setTextValue(finalColor);

      // Update color picker input
      if (colorInputRef.current) {
        colorInputRef.current.value = finalColor;
      }

      onChange(finalColor);
    } else if (normalizedValue && normalizedValue !== "#") {
      setValidationError("Invalid hex color format");
    }
  };

  // Handle text input blur
  const handleTextBlur = () => {
    setIsEditingText(false);

    if (!textValue || textValue === "#") {
      setTextValue(previewColor);
      setValidationError("");
      return;
    }

    if (!isValidHexColor(textValue)) {
      setValidationError("Invalid hex color format");
      setTextValue(previewColor); // Reset to last valid color
    } else {
      const finalColor = normalizeHexColor(textValue);
      setPreviewColor(finalColor);
      setTextValue(finalColor);

      if (colorInputRef.current) {
        colorInputRef.current.value = finalColor;
      }

      onChange(finalColor);
      setValidationError("");
    }
  };

  // Handle text input key press
  const handleTextKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTextBlur();
      textInputRef.current?.blur();
    } else if (e.key === "Escape") {
      setTextValue(previewColor);
      setValidationError("");
      setIsEditingText(false);
      textInputRef.current?.blur();
    }
  };

  // Handle color picker focus events
  const handleColorPickerBlur = () => {
    setIsFocused(false);
    if (colorInputRef.current) {
      onChange(colorInputRef.current.value);
    }
  };

  const handleColorPickerFocus = () => {
    setIsFocused(true);
  };

  // Toggle edit mode
  const handleToggleEdit = () => {
    if (isEditingText) {
      handleTextBlur();
    } else {
      setIsEditingText(true);
      setTimeout(() => {
        textInputRef.current?.focus();
        textInputRef.current?.select();
      }, 50);
    }
  };

  return (
    <div className="space-y-2.5">
      <Label
        htmlFor={`color-picker-${label.toLowerCase().replace(/\s+/g, "-")}`}
        className="text-sm font-medium flex items-center gap-1.5"
      >
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>

      <div className="flex items-start gap-3">
        {/* Color Preview Circle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className="h-10 w-10 rounded-lg shadow-sm flex-shrink-0 relative overflow-hidden cursor-pointer"
              style={{ backgroundColor: previewColor }}
              animate={{
                scale: isFocused ? 1.05 : 1,
                boxShadow: isFocused
                  ? "0 0 0 2px rgba(255,255,255,0.1), 0 0 0 4px " + previewColor + "60"
                  : "none"
              }}
              transition={{ duration: 0.2 }}
              onClick={() => colorInputRef.current?.click()}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"
                style={{ opacity: isFocused ? 0.2 : 0 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Pipette className="h-4 w-4 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to open color picker</p>
          </TooltipContent>
        </Tooltip>

        {/* Hidden Color Input */}
        <input
          ref={colorInputRef}
          type="color"
          defaultValue={defaultColor || "#ffffff"}
          onChange={handleColorPickerPreview}
          onBlur={handleColorPickerBlur}
          onFocus={handleColorPickerFocus}
          onInput={handleColorPickerChange}
          className="absolute opacity-0 pointer-events-none"
          tabIndex={-1}
        />

        {/* Text Input Area */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {isEditingText ? (
                  <motion.div
                    key="text-input"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    transition={{ duration: 0.15 }}
                    className="relative"
                  >
                    <Input
                      ref={textInputRef}
                      value={textValue}
                      onChange={handleTextChange}
                      onBlur={handleTextBlur}
                      onKeyDown={handleTextKeyPress}
                      placeholder="#FFFFFF"
                      className={`h-10 font-mono text-sm ${validationError
                        ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                        : ""
                        }`}
                      autoFocus
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="display-mode"
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.15 }}
                    className="h-10 w-full rounded-lg border bg-background px-3 flex items-center text-sm shadow-xs cursor-pointer overflow-hidden"
                    onClick={handleToggleEdit}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono">{previewColor.toUpperCase()}</span>
                      <motion.div
                        className="flex items-center justify-center h-6 px-2 rounded-md text-xs font-medium bg-muted/50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <AnimatePresence>
              {isEditingText && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="flex gap-1"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={handleToggleEdit}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Apply color</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={() => {
                          setTextValue(previewColor);
                          setValidationError("");
                          setIsEditingText(false);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancel</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Validation Error */}
          <AnimatePresence>
            {validationError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-destructive flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                {validationError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
