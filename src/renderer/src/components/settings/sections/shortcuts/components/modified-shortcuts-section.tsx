import React from "react";
import { ShortcutAction } from "~/types/shortcuts";
import { AnimatePresence, motion } from "motion/react";
import { InfoIcon } from "lucide-react";
import { ShortcutItem } from "../shortcut-item";

interface ModifiedShortcutsSectionProps {
  shortcuts: ShortcutAction[];
  editingActionId: string | null;
  shortcutInputValue: string;
  isRecording: boolean;
  inputRef: React.RefObject<HTMLDivElement | null>;
  formatShortcutForDisplay: (shortcut: string | null) => string;
  onEditClick: (action: ShortcutAction) => void;
  onSaveEdit: (actionId: string) => void;
  onCancelEdit: () => void;
  onResetShortcut: (action: ShortcutAction) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function ModifiedShortcutsSection({
  shortcuts,
  editingActionId,
  shortcutInputValue,
  isRecording,
  inputRef,
  formatShortcutForDisplay,
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  onResetShortcut,
  onKeyDown
}: ModifiedShortcutsSectionProps) {
  if (shortcuts.length === 0) return null;

  return (
    <motion.div
      key="modified-section"
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/30">
        <h3 className="text-lg font-semibold text-primary mb-3 border-b border-primary/30 pb-2 flex items-center">
          <InfoIcon className="h-5 w-5 mr-2" />
          Modified Shortcuts ({shortcuts.length})
        </h3>
        <div className="space-y-2">
          <AnimatePresence>
            {shortcuts.map((shortcut) => (
              <ShortcutItem
                key={`modified-${shortcut.id}`}
                shortcut={shortcut}
                isEditing={editingActionId === shortcut.id}
                shortcutInputValue={editingActionId === shortcut.id ? shortcutInputValue : ""}
                isRecording={isRecording}
                onEdit={() => onEditClick(shortcut)}
                onSave={() => onSaveEdit(shortcut.id)}
                onCancel={onCancelEdit}
                onReset={() => onResetShortcut(shortcut)}
                onKeyDown={onKeyDown}
                inputRef={inputRef}
                formatShortcutForDisplay={formatShortcutForDisplay}
                isModified={true}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
