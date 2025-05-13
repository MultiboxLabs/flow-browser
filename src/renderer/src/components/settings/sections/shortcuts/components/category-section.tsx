import React from "react";
import { ShortcutAction } from "~/types/shortcuts";
import { AnimatePresence, motion } from "motion/react";
import { ShortcutItem } from "../shortcut-item";

interface CategorySectionProps {
  categoryName: string;
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
  animationDelay?: number;
}

export function CategorySection({
  categoryName,
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
  onKeyDown,
  animationDelay = 0
}: CategorySectionProps) {
  const modifiedCount = shortcuts.filter((kb) => kb.originalShortcut && kb.shortcut !== kb.originalShortcut).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + animationDelay }}
    >
      <h3 className="text-lg font-semibold text-card-foreground mb-3 border-b pb-2 flex items-center gap-2">
        {categoryName}
        {modifiedCount > 0 && (
          <span className="text-xs text-primary font-normal bg-primary/10 px-2 py-0.5 rounded-full">
            {modifiedCount} modified
          </span>
        )}
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {shortcuts.map((shortcut, index) => (
            <ShortcutItem
              key={shortcut.id}
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
              isModified={
                !!shortcut.originalShortcut && !!shortcut.shortcut && shortcut.originalShortcut !== shortcut.shortcut
              }
              animationDelay={index * 0.03}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
