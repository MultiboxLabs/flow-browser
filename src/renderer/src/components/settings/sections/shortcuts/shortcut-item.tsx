import React from "react";
import { Button } from "@/components/ui/button";
import { Edit3Icon, RotateCcwIcon, SaveIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShortcutAction } from "~/types/shortcuts";
import { motion } from "motion/react";

interface ShortcutItemProps {
  shortcut: ShortcutAction;
  isEditing: boolean;
  shortcutInputValue: string;
  isRecording: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  inputRef: React.RefObject<HTMLDivElement | null>;
  formatShortcutForDisplay: (shortcut: string | null) => string;
  isModified: boolean;
  animationDelay?: number;
}

export function ShortcutItem({
  shortcut,
  isEditing,
  shortcutInputValue,
  isRecording,
  onEdit,
  onSave,
  onCancel,
  onReset,
  onKeyDown,
  inputRef,
  formatShortcutForDisplay,
  isModified,
  animationDelay = 0
}: ShortcutItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.2, delay: animationDelay }}
      className={cn(
        "flex items-center justify-between p-3 rounded-md border bg-background hover:bg-muted/30 transition-all gap-2 sm:gap-4",
        isModified && "border-primary/30 bg-primary/5",
        isEditing && "ring-2 ring-primary/30 shadow-sm"
      )}
    >
      <p className="text-sm font-medium text-card-foreground truncate flex-grow" title={shortcut.name}>
        {shortcut.name}
        {isModified && <span className="ml-2 text-xs text-primary font-normal">(Modified)</span>}
      </p>
      {isEditing ? (
        <motion.div
          className="flex items-center gap-2 flex-wrap flex-shrink"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div
            ref={inputRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className={cn(
              "h-9 min-w-[150px] flex-grow px-3 py-2 text-xs font-mono rounded-md border border-input bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-text flex items-center justify-center",
              isRecording && "border-primary text-primary animate-pulse"
            )}
          >
            {isRecording ? (
              <span className="text-muted-foreground italic flex items-center">
                Recording<span className="animate-pulse">...</span>
              </span>
            ) : shortcutInputValue ? (
              shortcutInputValue
            ) : (
              <span className="text-muted-foreground italic">Click to record</span>
            )}
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
              onClick={onSave}
              title="Save"
              disabled={!shortcutInputValue}
            >
              <SaveIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={onCancel}
              title="Cancel Edit"
            >
              <XIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
              onClick={onReset}
              title="Reset to Default"
            >
              <RotateCcwIcon className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.span
            className={cn(
              "text-xs font-mono px-2 py-1 rounded-md min-w-[120px] text-center",
              !shortcut.shortcut && "italic text-destructive-foreground/80 bg-destructive/70",
              isModified ? "bg-primary/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {formatShortcutForDisplay(shortcut.shortcut)}
          </motion.span>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 opacity-70 hover:opacity-100 transition-opacity",
              "hover:bg-primary/10 hover:text-primary"
            )}
            onClick={onEdit}
            title="Edit Shortcut"
          >
            <Edit3Icon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
