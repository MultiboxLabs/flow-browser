"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { KeyboardIcon } from "lucide-react";
import { toast } from "sonner";
import { ShortcutAction } from "~/types/shortcuts";
import { useShortcuts } from "@/components/providers/shortcuts-provider";
import { AnimatePresence, motion } from "motion/react";

// Import components and hooks
import { SearchHeader } from "./components/search-header";
import { EmptyState } from "./components/empty-state";
import { ModifiedShortcutsSection } from "./components/modified-shortcuts-section";
import { CategorySection } from "./components/category-section";
import { ResetDialog } from "./components/reset-dialog";
import { useDebounce } from "@/hooks/use-debounce";
import { useKeyboardNormalizer } from "./hooks/use-keyboard-normalizer";

export function ShortcutsSettings() {
  const { shortcuts, isLoading, setShortcut, resetShortcut, resetAllShortcuts, formatShortcutForDisplay } =
    useShortcuts();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [shortcutInputValue, setShortcutInputValue] = useState(""); // Formatted for display in input
  const [tempRawShortcut, setTempRawShortcut] = useState(""); // Raw keys, e.g., "Meta+Shift+K"
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLDivElement | null>(null);
  const { processKeyboardEvent } = useKeyboardNormalizer();

  const handleEditClick = useCallback(
    (action: ShortcutAction) => {
      setEditingActionId(action.id);
      if (typeof action.shortcut === "string") {
        setTempRawShortcut(action.shortcut);
        setShortcutInputValue(formatShortcutForDisplay(action.shortcut));
      } else {
        setTempRawShortcut("");
        setShortcutInputValue("None");
      }
      setIsRecording(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [formatShortcutForDisplay]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingActionId(null);
    setShortcutInputValue("");
    setTempRawShortcut("");
    setIsRecording(false);
  }, []);

  const handleSaveEdit = useCallback(
    async (actionId: string) => {
      try {
        if (!tempRawShortcut) {
          toast.error("Please record a valid shortcut first.");
          return;
        }

        const success = await setShortcut(actionId, tempRawShortcut);
        if (success) {
          toast.success("Shortcut updated successfully.");
          handleCancelEdit();
        } else {
          toast.error("Failed to update shortcut.");
        }
      } catch (error) {
        console.error("Error saving shortcut:", error);
        toast.error("An error occurred while saving the shortcut.");
      }
    },
    [tempRawShortcut, setShortcut, handleCancelEdit]
  );

  const handleResetIndividualKeybind = useCallback(
    async (action: ShortcutAction) => {
      try {
        const success = await resetShortcut(action.id);
        if (success) {
          toast.success(`Shortcut for "${action.name}" reset to default.`);
          if (editingActionId === action.id) {
            // The original shortcut will be restored after shortcuts are refreshed
            // Just close the editor for now
            handleCancelEdit();
          }
        } else {
          toast.error(`Could not reset shortcut for "${action.name}".`);
        }
      } catch (error) {
        console.error("Error resetting shortcut:", error);
        toast.error("An error occurred while resetting the shortcut.");
      }
    },
    [editingActionId, resetShortcut, handleCancelEdit]
  );

  const performResetAllKeybinds = useCallback(async () => {
    try {
      await resetAllShortcuts();
      toast.success("All shortcuts have been reset to their defaults.");
    } catch (error) {
      console.error("Failed to reset all keybinds:", error);
      toast.error("Could not reset all shortcuts.");
    }
  }, [resetAllShortcuts]);

  const handleShortcutKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const { key } = event;

      if (key === "Escape") {
        handleCancelEdit();
        return;
      }

      if (key === "Enter" && editingActionId && tempRawShortcut) {
        handleSaveEdit(editingActionId);
        return;
      }

      if (key === "Backspace" || key === "Delete") {
        setTempRawShortcut("");
        setShortcutInputValue("");
        setIsRecording(true);
        return;
      }

      setIsRecording(true);

      const newRawShortcut = processKeyboardEvent(event);
      if (newRawShortcut) {
        setTempRawShortcut(newRawShortcut);
        setShortcutInputValue(formatShortcutForDisplay(newRawShortcut));
        setIsRecording(false);
      }
    },
    [editingActionId, formatShortcutForDisplay, handleCancelEdit, handleSaveEdit, processKeyboardEvent, tempRawShortcut]
  );

  // Memoize the filtered and grouped shortcuts for performance
  const { groupedKeybinds, modifiedShortcuts, sortedEntries } = useMemo(() => {
    const filtered = shortcuts.filter(
      (kb) =>
        kb.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        kb.category.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (kb.shortcut && formatShortcutForDisplay(kb.shortcut).toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
    );

    const grouped = filtered.reduce(
      (acc, kb) => {
        if (!acc[kb.category]) {
          acc[kb.category] = [];
        }
        acc[kb.category].push(kb);
        return acc;
      },
      {} as Record<string, ShortcutAction[]>
    );

    const modified = filtered.filter(
      (kb) => !!kb.originalShortcut && !!kb.shortcut && kb.originalShortcut !== kb.shortcut
    );

    const sorted = Object.entries(grouped).sort((a, b) => {
      if (a[0] === "Modified") return -1;
      if (b[0] === "Modified") return 1;
      return a[0].localeCompare(b[0]);
    });

    return {
      groupedKeybinds: grouped,
      modifiedShortcuts: modified,
      sortedEntries: sorted
    };
  }, [debouncedSearchTerm, shortcuts, formatShortcutForDisplay]);

  return (
    <div className="space-y-6 remove-app-drag">
      <motion.div initial={{ opacity: 0.8, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="text-2xl font-semibold text-card-foreground flex items-center gap-2">
          <KeyboardIcon className="h-6 w-6" />
          Keyboard Shortcuts
        </h2>
        <p className="text-muted-foreground">Customize Flow keyboard shortcuts to improve your workflow.</p>
      </motion.div>

      <motion.div
        className="rounded-lg border bg-card text-card-foreground p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <SearchHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onResetClick={() => setIsResetDialogOpen(true)}
          isLoading={isLoading}
        />

        {isLoading ? (
          <EmptyState type="loading" />
        ) : Object.keys(groupedKeybinds).length === 0 && debouncedSearchTerm ? (
          <EmptyState type="no-results" searchTerm={debouncedSearchTerm} />
        ) : Object.keys(groupedKeybinds).length === 0 ? (
          <EmptyState type="no-shortcuts" />
        ) : (
          <div className="space-y-8">
            {/* Modified shortcuts section */}
            <AnimatePresence>
              {modifiedShortcuts.length > 0 && (
                <ModifiedShortcutsSection
                  shortcuts={modifiedShortcuts}
                  editingActionId={editingActionId}
                  shortcutInputValue={shortcutInputValue}
                  isRecording={isRecording}
                  inputRef={inputRef}
                  formatShortcutForDisplay={formatShortcutForDisplay}
                  onEditClick={handleEditClick}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onResetShortcut={handleResetIndividualKeybind}
                  onKeyDown={handleShortcutKeyDown}
                />
              )}
            </AnimatePresence>

            {/* Regular categories */}
            {sortedEntries.map(([category, shortcuts], index) => (
              <CategorySection
                key={category}
                categoryName={category}
                shortcuts={shortcuts}
                editingActionId={editingActionId}
                shortcutInputValue={shortcutInputValue}
                isRecording={isRecording}
                inputRef={inputRef}
                formatShortcutForDisplay={formatShortcutForDisplay}
                onEditClick={handleEditClick}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onResetShortcut={handleResetIndividualKeybind}
                onKeyDown={handleShortcutKeyDown}
                animationDelay={index * 0.05}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Reset All Confirmation Dialog */}
      <ResetDialog isOpen={isResetDialogOpen} onOpenChange={setIsResetDialogOpen} onConfirm={performResetAllKeybinds} />
    </div>
  );
}
