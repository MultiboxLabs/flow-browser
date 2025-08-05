import { useRef, useState, useEffect, useCallback } from "react";
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
  disabled?: boolean;
  className?: string;
}

export function ColorPicker({
  defaultColor,
  label,
  onChange,
  disabled = false,
  className = ""
}: ColorPickerProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Consolidated state
  const [state, setState] = useState({
    currentColor: defaultColor || "#ffffff",
    textValue: defaultColor || "#ffffff",
    isFocused: false,
    isEditingText: false,
    validationError: ""
  });

  // Sync with defaultColor changes
  useEffect(() => {
    const newColor = defaultColor || "#ffffff";
    setState(prev => ({
      ...prev,
      currentColor: newColor,
      textValue: newColor
    }));
  }, [defaultColor]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Utility functions
  const isValidHexColor = useCallback((hex: string): boolean => {
    // More strict hex validation - exactly 3 or 6 characters after #
    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex);
  }, []);

  const normalizeHexColor = useCallback((hex: string): string => {
    if (hex.length === 4) {
      return "#" + hex[1].repeat(2) + hex[2].repeat(2) + hex[3].repeat(2);
    }
    return hex;
  }, []);

  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Debounced onChange call with cleanup
  const debouncedOnChange = useCallback((color: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onChange(color);
      timeoutRef.current = null;
    }, 100);
  }, [onChange]);

  // Color picker handlers
  const handleColorPickerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const newColor = e.target.value;
    updateState({
      currentColor: newColor,
      textValue: newColor,
      validationError: ""
    });
    debouncedOnChange(newColor);
  }, [updateState, debouncedOnChange, disabled]);

  const handleColorPickerFocus = useCallback(() => {
    if (!disabled) {
      updateState({ isFocused: true });
    }
  }, [updateState, disabled]);

  const handleColorPickerBlur = useCallback(() => {
    updateState({ isFocused: false });
    if (colorInputRef.current) {
      onChange(colorInputRef.current.value);
    }
  }, [updateState, onChange]);

  // Text input handlers
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;

    const value = e.target.value;
    const normalizedValue = value.startsWith("#") ? value : "#" + value;

    const error = normalizedValue !== "#" && !isValidHexColor(normalizedValue)
      ? "Invalid hex color format (use #RGB or #RRGGBB)"
      : "";

    updateState({
      textValue: value,
      validationError: error
    });
  }, [updateState, isValidHexColor, disabled]);

  // Text editing actions
  const cancelTextEdit = useCallback(() => {
    updateState({
      textValue: state.currentColor,
      isEditingText: false,
      validationError: ""
    });
  }, [state.currentColor, updateState]);

  const applyTextChanges = useCallback(() => {
    const { textValue } = state;

    if (!textValue || textValue === "#") {
      cancelTextEdit();
      return;
    }

    const normalizedValue = textValue.startsWith("#") ? textValue : "#" + textValue;

    if (!isValidHexColor(normalizedValue)) {
      updateState({
        validationError: "Invalid hex color format (use #RGB or #RRGGBB)",
        textValue: state.currentColor
      });
      return;
    }

    const finalColor = normalizeHexColor(normalizedValue);

    updateState({
      currentColor: finalColor,
      textValue: finalColor,
      isEditingText: false,
      validationError: ""
    });

    if (colorInputRef.current) {
      colorInputRef.current.value = finalColor;
    }

    onChange(finalColor);
  }, [state, updateState, isValidHexColor, normalizeHexColor, onChange, cancelTextEdit]);

  const handleTextKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyTextChanges();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelTextEdit();
    }
  }, [applyTextChanges, cancelTextEdit]);

  const handleTextBlur = useCallback(() => {
    if (state.isEditingText) {
      cancelTextEdit();
    }
  }, [state.isEditingText, cancelTextEdit]);

  const toggleEditMode = useCallback(() => {
    if (disabled) return;

    if (state.isEditingText) {
      applyTextChanges();
    } else {
      updateState({ isEditingText: true });
      // Focus and select text after state update
      requestAnimationFrame(() => {
        textInputRef.current?.focus();
        textInputRef.current?.select();
      });
    }
  }, [state.isEditingText, updateState, applyTextChanges, disabled]);

  // Generate component ID
  const componentId = `color-picker-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={`space-y-2.5 ${className}`.trim()}>
      <Label htmlFor={componentId} className="text-sm font-medium flex items-center gap-1.5">
        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>

      <div className="flex items-start gap-3">
        {/* Color Preview Circle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              className={`h-10 w-10 rounded-lg shadow-sm flex-shrink-0 relative overflow-hidden cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              style={{ backgroundColor: state.currentColor }}
              animate={{
                scale: state.isFocused && !disabled ? 1.05 : 1,
                boxShadow: state.isFocused && !disabled
                  ? `0 0 0 2px rgba(255,255,255,0.1), 0 0 0 4px ${state.currentColor}60`
                  : "0 1px 3px 0 rgb(0 0 0 / 0.1)"
              }}
              transition={{ duration: 0.2 }}
              onClick={() => !disabled && colorInputRef.current?.click()}
            >
              <div
                className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent transition-opacity duration-200"
                style={{ opacity: state.isFocused && !disabled ? 0.2 : 0 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Pipette className={`h-4 w-4 text-white/80 transition-opacity duration-200 ${disabled ? 'opacity-30' : 'opacity-0 group-hover:opacity-100'
                  }`} />
              </div>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabled ? 'Color picker disabled' : 'Click to open color picker'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Hidden Color Input */}
        <input
          ref={colorInputRef}
          id={componentId}
          type="color"
          value={state.currentColor}
          onChange={handleColorPickerChange}
          onBlur={handleColorPickerBlur}
          onFocus={handleColorPickerFocus}
          disabled={disabled}
          className="absolute opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-label={`${label} color picker`}
        />

        {/* Text Input Area */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <AnimatePresence mode="wait">
                {state.isEditingText ? (
                  <motion.div
                    key="text-input"
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -2 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Input
                      ref={textInputRef}
                      value={state.textValue}
                      onChange={handleTextChange}
                      onBlur={handleTextBlur}
                      onKeyDown={handleTextKeyPress}
                      disabled={disabled}
                      placeholder="#FFFFFF"
                      className={`h-10 font-mono text-sm ${state.validationError
                        ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                        : ""
                        }`}
                      aria-describedby={state.validationError ? `${componentId}-error` : undefined}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="display-mode"
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 2 }}
                    transition={{ duration: 0.15 }}
                    className={`h-10 w-full rounded-lg border bg-background px-3 flex items-center text-sm shadow-sm overflow-hidden transition-colors ${disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:bg-accent/50'
                      }`}
                    onClick={toggleEditMode}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono">{state.currentColor.toUpperCase()}</span>
                      <motion.div
                        className={`flex items-center justify-center h-6 px-2 rounded-md text-xs font-medium transition-colors ${disabled
                          ? 'bg-muted/30 text-muted-foreground'
                          : 'bg-muted/50 hover:bg-muted'
                          }`}
                        whileHover={disabled ? {} : { scale: 1.05 }}
                        whileTap={disabled ? {} : { scale: 0.95 }}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        {disabled ? 'Disabled' : 'Edit'}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Action Buttons */}
            <AnimatePresence>
              {state.isEditingText && !disabled && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 10 }}
                  transition={{ duration: 0.15 }}
                  className="flex gap-1"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        onClick={toggleEditMode}
                        disabled={!!state.validationError}
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
                        onClick={cancelTextEdit}
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
            {state.validationError && (
              <motion.p
                id={`${componentId}-error`}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-destructive flex items-center gap-1"
                role="alert"
              >
                <X className="h-3 w-3" />
                {state.validationError}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}