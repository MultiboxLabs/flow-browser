import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save, Settings, Trash2, PaintBucket, Check } from "lucide-react";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import { BasicSettingsTab, ThemeSettingsTab } from "./editor-tabs";
import { DeleteConfirmDialog } from "./space-dialogs";
import { motion, AnimatePresence } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Main Space Editor Component
interface SpaceEditorProps {
  space: Space;
  onClose: () => void;
  onDelete: () => void;
  onSpacesUpdate: () => void;
}

export function SpaceEditor({ space, onClose, onDelete, onSpacesUpdate }: SpaceEditorProps) {
  // State management
  const [editedSpace, setEditedSpace] = useState<Space>({ ...space });
  const [activeTab, setActiveTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update edited space
  const updateEditedSpace = (updates: Partial<Space>) => {
    setEditedSpace((prev) => ({ ...prev, ...updates }));
  };

  // Handle space update
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // Only send the fields that have changed
      const updatedFields: Partial<Space> = {};

      if (editedSpace.name !== space.name) {
        updatedFields.name = editedSpace.name;
      }

      if (editedSpace.bgStartColor !== space.bgStartColor) {
        updatedFields.bgStartColor = editedSpace.bgStartColor;
      }

      if (editedSpace.bgEndColor !== space.bgEndColor) {
        updatedFields.bgEndColor = editedSpace.bgEndColor;
      }

      if (editedSpace.icon !== space.icon) {
        updatedFields.icon = editedSpace.icon;
      }

      if (Object.keys(updatedFields).length > 0) {
        console.log("Updating space:", space.id, updatedFields);

        await flow.spaces.updateSpace(space.profileId, space.id, updatedFields);
        onSpacesUpdate(); // Refetch spaces after successful update
        setSaveSuccess(true);

        // Auto-close after short delay
        setTimeout(() => {
          if (saveSuccess) {
            onClose();
          }
        }, 1500);
      } else {
        // No changes to save
        onClose();
      }
    } catch (error) {
      console.error("Failed to update space:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle space deletion with confirmation
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await flow.spaces.deleteSpace(space.profileId, space.id);
      onDelete();
      onClose();
    } catch (error) {
      console.error("Failed to delete space:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle input field changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedSpace({
      ...editedSpace,
      name: e.target.value
    });
  };

  // Detect if there are unsaved changes
  const hasChanges = () => {
    return (
      editedSpace.name !== space.name ||
      editedSpace.bgStartColor !== space.bgStartColor ||
      editedSpace.bgEndColor !== space.bgEndColor ||
      editedSpace.icon !== space.icon
    );
  };

  return (
    <motion.div
      className="z-50 flex flex-col bg-background h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Bar */}
      <motion.div
        className="flex items-center border-b p-4"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-medium">Edit Space</h2>
          <p className="text-sm text-muted-foreground">Customize your browsing space</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-1 transition-all hover:bg-destructive/90"
            title="Delete space"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <AnimatePresence mode="wait">
            {saveSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Button variant="default" size="sm" className="gap-1 bg-green-600 hover:bg-green-700">
                  <Check className="h-4 w-4" />
                  Saved
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="save"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  className={`gap-1 transition-all ${hasChanges() ? "bg-primary hover:bg-primary/90" : "bg-muted/80 hover:bg-muted"}`}
                  disabled={isSaving || !hasChanges()}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Content Area with Tabs */}
      <div className="flex flex-row flex-1 overflow-hidden">
        <Tabs
          defaultValue="basic"
          onValueChange={setActiveTab}
          value={activeTab}
          className="flex flex-row flex-1 h-full"
          orientation="vertical"
        >
          {/* Tab Navigation - Always Vertical */}
          <div className="border-r min-h-0 h-full flex-shrink-0">
            <div className="p-4">
              <TabsList className="flex flex-col items-stretch h-auto bg-background p-0 gap-1">
                <TabsTrigger value="basic" className="w-full data-[state=active]:text-primary flex justify-start gap-2">
                  <Settings className="h-5 w-5" />
                  <span>Basic Settings</span>
                </TabsTrigger>
                <TabsTrigger value="theme" className="w-full data-[state=active]:text-primary flex justify-start gap-2">
                  <PaintBucket className="h-5 w-5" />
                  <span>Theme Settings</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6 overflow-auto">
            <AnimatePresence mode="wait">
              <TabsContent value="basic" className="m-0 h-full">
                <BasicSettingsTab space={space} editedSpace={editedSpace} handleNameChange={handleNameChange} />
              </TabsContent>

              <TabsContent value="theme" className="m-0 h-full">
                <ThemeSettingsTab editedSpace={editedSpace} updateEditedSpace={updateEditedSpace} />
              </TabsContent>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={setDeleteDialogOpen}
        spaceName={space.name}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </motion.div>
  );
}
