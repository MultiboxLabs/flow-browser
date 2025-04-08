import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Save, Settings, Trash2, PaintBucket } from "lucide-react";
import type { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { BasicSettingsTab, ThemeSettingsTab } from "./editor-tabs";
import { DeleteConfirmDialog } from "./space-dialogs";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update edited space
  const updateEditedSpace = (updates: Partial<Space>) => {
    setEditedSpace((prev) => ({ ...prev, ...updates }));
  };

  // Handle space update
  const handleSave = async () => {
    setIsSaving(true);
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
      }
      onClose();
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

  return (
    <div className="z-50 flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center border-b p-4">
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
            className="gap-1"
            title="Delete space"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="default" size="sm" onClick={handleSave} className="gap-1" disabled={isSaving}>
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
        </div>
      </div>

      {/* Content Area with Sidebar and Main Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 border-r p-4">
          <nav className="space-y-1">
            <Button
              variant={activeTab === "basic" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("basic")}
            >
              <Settings className="mr-2 h-5 w-5" />
              Basic Settings
            </Button>
            <Button
              variant={activeTab === "theme" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("theme")}
            >
              <PaintBucket className="mr-2 h-5 w-5" />
              Theme Settings
            </Button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === "basic" && (
            <div className="space-y-6">
              <BasicSettingsTab space={space} editedSpace={editedSpace} handleNameChange={handleNameChange} />
            </div>
          )}

          {activeTab === "theme" && (
            <div className="space-y-6">
              <ThemeSettingsTab editedSpace={editedSpace} updateEditedSpace={updateEditedSpace} />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={setDeleteDialogOpen}
        spaceName={space.name}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
