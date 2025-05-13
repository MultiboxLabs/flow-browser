"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CommandIcon, Edit3Icon, Loader2, RotateCcwIcon, SearchIcon, SaveIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ShortcutAction } from "~/types/shortcuts";
import { useShortcuts } from "@/components/providers/shortcuts-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export function ShortcutsSettings() {
  const { shortcuts, isLoading, setShortcut, resetShortcut, resetAllShortcuts, formatShortcutForDisplay } =
    useShortcuts();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [shortcutInputValue, setShortcutInputValue] = useState(""); // Formatted for display in input
  const [tempRawShortcut, setTempRawShortcut] = useState(""); // Raw keys, e.g., "Meta+Shift+K"
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const shortcutInputRef = useRef<HTMLDivElement>(null);

  const handleEditClick = (action: ShortcutAction) => {
    setEditingActionId(action.id);
    setTempRawShortcut(action.shortcut);
    setShortcutInputValue(formatShortcutForDisplay(action.shortcut));
    setTimeout(() => shortcutInputRef.current?.focus(), 0); // Focus after render
  };

  const handleCancelEdit = () => {
    setEditingActionId(null);
    setShortcutInputValue("");
    setTempRawShortcut("");
  };

  const handleSaveEdit = async (actionId: string) => {
    try {
      const success = await setShortcut(actionId, tempRawShortcut);
      if (success) {
        toast.success("Shortcut updated successfully.");
      } else {
        toast.error("Failed to update shortcut.");
      }
      handleCancelEdit(); // Clear editing state
    } catch (error) {
      console.error("Error saving shortcut:", error);
      toast.error("An error occurred while saving the shortcut.");
    }
  };

  const handleResetIndividualKeybind = async (action: ShortcutAction) => {
    try {
      const newShortcut = await resetShortcut(action.id);
      if (newShortcut !== null) {
        toast.success(`Shortcut for "${action.name}" reset to default.`);
        if (editingActionId === action.id) {
          setTempRawShortcut(newShortcut);
          setShortcutInputValue(formatShortcutForDisplay(newShortcut));
        }
      } else {
        toast.error(`Could not reset shortcut for "${action.name}".`);
      }
    } catch (error) {
      console.error("Error resetting shortcut:", error);
      toast.error("An error occurred while resetting the shortcut.");
    }
  };

  const performResetAllKeybinds = async () => {
    try {
      await resetAllShortcuts();
      toast.success("All shortcuts have been reset to their defaults.");
    } catch (error) {
      console.error("Failed to reset all keybinds:", error);
      toast.error("Could not reset all shortcuts.");
    }
  };

  const normalizeKeyName = (key: string): string => {
    if (key === "Meta") return "CommandOrControl";
    if (key === "Control") return "CommandOrControl"; // Or just "Control" if you want to differentiate
    if (key === "AltGraph") return "Alt";
    if (key.startsWith("Arrow")) return key; // ArrowUp, ArrowDown, etc.
    if (key.length === 1 && ((key >= "a" && key <= "z") || (key >= "A" && key <= "Z") || (key >= "0" && key <= "9")))
      return key.toUpperCase();
    if (
      [
        "BracketLeft",
        "BracketRight",
        "Backslash",
        "Comma",
        "Period",
        "Slash",
        "Semicolon",
        "Quote",
        "Minus",
        "Equal",
        "Backquote"
      ].includes(key)
    )
      return key;
    if (key === " ") return "Space";
    return key; // For other keys like Enter, Tab, Escape, F1-F12, etc.
  };

  const handleShortcutKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const { key, metaKey, ctrlKey, altKey, shiftKey } = event;

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
      setShortcutInputValue("Recording...");
      return;
    }

    let parts: string[] = [];
    if (metaKey || (navigator.platform.toUpperCase().indexOf("MAC") >= 0 && ctrlKey)) parts.push("CommandOrControl");
    else if (ctrlKey) parts.push("CommandOrControl");
    if (altKey) parts.push("Alt");
    if (shiftKey && !["Shift", "Alt", "Control", "Meta"].includes(key)) parts.push("Shift"); // Add Shift only if it's not the main key pressed

    const normalizedKey = normalizeKeyName(key);
    if (!["Shift", "Alt", "Control", "Meta", "CommandOrControl"].includes(normalizedKey)) {
      parts.push(normalizedKey);
    }

    // Prevent duplicate modifiers if key itself is a modifier (already handled)
    parts = [...new Set(parts)];

    if (
      parts.length > 0 &&
      !(parts.length === 1 && ["Shift", "Alt", "Control", "Meta", "CommandOrControl"].includes(parts[0]))
    ) {
      const newRawShortcut = parts.join("+");
      setTempRawShortcut(newRawShortcut);
      setShortcutInputValue(formatShortcutForDisplay(newRawShortcut));
    } else if (parts.length === 0 && !["Shift", "Alt", "Control", "Meta"].includes(key)) {
      // Case for single character keys without modifiers, e.g. 'A'
      const newRawShortcut = normalizedKey;
      setTempRawShortcut(newRawShortcut);
      setShortcutInputValue(formatShortcutForDisplay(newRawShortcut));
    } else {
      // If only a modifier is pressed, or an invalid combo, show recording
      setShortcutInputValue("Recording...");
    }
  };

  const groupedKeybinds = shortcuts
    .filter(
      (kb) =>
        kb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kb.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (kb.shortcut && kb.shortcut.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .reduce(
      (acc, kb) => {
        if (!acc[kb.category]) {
          acc[kb.category] = [];
        }
        acc[kb.category].push(kb);
        return acc;
      },
      {} as Record<string, ShortcutAction[]>
    );

  return (
    <div className="space-y-6 remove-app-drag">
      <div>
        <h2 className="text-2xl font-semibold text-card-foreground">Keyboard Shortcuts</h2>
        <p className="text-muted-foreground">Customize Flow keyboard shortcuts to improve your workflow.</p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-xs">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search shortcuts..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsResetDialogOpen(true)} disabled={isLoading}>
              <RotateCcwIcon className="h-4 w-4 mr-2" />
              Reset All Defaults
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-3" />
            <p className="text-muted-foreground">Loading keyboard shortcuts...</p>
          </div>
        ) : Object.keys(groupedKeybinds).length === 0 && searchTerm ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <CommandIcon className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-card-foreground">No matching shortcuts found</p>
            <p className="text-sm text-muted-foreground mt-1">Try a different search term.</p>
          </div>
        ) : Object.keys(groupedKeybinds).length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <CommandIcon className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-card-foreground">No shortcuts available</p>
            <p className="text-sm text-muted-foreground mt-1">Shortcuts could not be loaded or none are defined.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedKeybinds).map(([category, kbs]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-card-foreground mb-3 border-b pb-2">{category}</h3>
                <div className="space-y-2">
                  {kbs.map((kb) => (
                    <div
                      key={kb.id}
                      className="flex items-center justify-between p-3 rounded-md border bg-background hover:bg-muted/30 transition-colors gap-2 sm:gap-4"
                    >
                      <p className="text-sm font-medium text-card-foreground truncate flex-grow" title={kb.name}>
                        {kb.name}
                      </p>
                      {editingActionId === kb.id ? (
                        <div className="flex items-center gap-2 flex-wrap flex-shrink">
                          <div
                            ref={shortcutInputRef}
                            tabIndex={0}
                            onKeyDown={handleShortcutKeyDown}
                            className="h-9 min-w-[150px] flex-grow px-3 py-2 text-xs font-mono rounded-md border border-input bg-transparent ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-text"
                          >
                            {shortcutInputValue || <span className="text-muted-foreground italic">Recording...</span>}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSaveEdit(kb.id)}
                            title="Save"
                          >
                            <SaveIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleCancelEdit}
                            title="Cancel Edit"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleResetIndividualKeybind(kb)}
                            title="Reset to Default"
                          >
                            <RotateCcwIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={cn(
                              "text-xs font-mono bg-muted px-2 py-1 rounded-md text-muted-foreground min-w-[120px] text-center",
                              !kb.shortcut && "italic text-destructive-foreground/80 bg-destructive/70"
                            )}
                          >
                            {formatShortcutForDisplay(kb.shortcut)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEditClick(kb)}
                            title="Edit Shortcut"
                          >
                            <Edit3Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reset All Confirmation Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset All Shortcuts</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all shortcuts to their default values? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setIsResetDialogOpen(false);
                performResetAllKeybinds();
              }}
            >
              Reset All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
