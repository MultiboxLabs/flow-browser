import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { createSpace, deleteSpace, getSpaces, updateProfile, getProfiles, updateSpace } from "@/lib/flow";
import type { Space, Profile } from "@/lib/flow";
import { Trash2, ArrowLeft, Settings, Save, Loader2, Plus, Check, PaintBucket, CircleHelp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLucideIcon } from "@/lib/utils";
import dynamicIconImports from "lucide-react/dynamicIconImports";

// ==============================
// Space Card Component
// ==============================
interface SpaceCardProps {
  space: Space;
  activateEdit: () => void;
}

function SpaceCard({ space, activateEdit }: SpaceCardProps) {
  const [SpaceIcon, setSpaceIcon] = useState<React.ComponentType<{ className?: string }> | null>(null);

  useEffect(() => {
    async function loadIcon() {
      try {
        if (space.icon) {
          const icon = await getLucideIcon(space.icon);
          setSpaceIcon(() => icon);
        } else {
          // Default icon if none is set
          const icon = await getLucideIcon("Globe");
          setSpaceIcon(() => icon);
        }
      } catch (error) {
        console.error("Failed to load icon:", error);
      }
    }

    loadIcon();
  }, [space.icon]);

  return (
    <motion.div
      key={space.id}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="flex items-center border rounded-lg p-4 cursor-pointer hover:border-primary/50"
      onClick={() => activateEdit()}
    >
      <div
        className="h-10 w-10 rounded-full mr-3 flex items-center justify-center"
        style={{
          background:
            space.bgStartColor && space.bgEndColor
              ? `linear-gradient(to bottom right, ${space.bgStartColor}, ${space.bgEndColor})`
              : "var(--muted)"
        }}
      >
        {SpaceIcon && <SpaceIcon className="h-5 w-5 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base truncate">{space.name}</h3>
        <p className="text-xs text-muted-foreground truncate">ID: {space.id}</p>
      </div>
    </motion.div>
  );
}

// ==============================
// Space Editor Components
// ==============================
interface SpaceEditorProps {
  space: Space;
  onClose: () => void;
  onDelete: () => void;
  onSpacesUpdate: () => void;
}

// Basic Settings Tab Component
interface BasicSettingsTabProps {
  space: Space;
  editedSpace: Space;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function BasicSettingsTab({ space, editedSpace, handleNameChange }: BasicSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Basic Information</CardTitle>
        <CardDescription>Manage your space's basic settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="space-name">Space Name</Label>
          <Input id="space-name" value={editedSpace.name} onChange={handleNameChange} placeholder="Enter space name" />
        </div>

        <div className="space-y-2">
          <Label>Space ID</Label>
          <div className="p-2 bg-muted rounded-md text-sm">{space.id}</div>
        </div>

        <div className="space-y-2">
          <Label>Profile ID</Label>
          <div className="p-2 bg-muted rounded-md text-sm">{space.profileId}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==============================
// LucideIconPicker Component
// ==============================
interface LucideIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconId: string) => void;
}

function LucideIconPicker({ selectedIcon, onSelectIcon }: LucideIconPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [iconList, setIconList] = useState<string[]>([]);
  const [filteredIcons, setFilteredIcons] = useState<string[]>([]);

  // Load icons on component mount
  useEffect(() => {
    const icons = Object.keys(dynamicIconImports);
    setIconList(icons);
    setFilteredIcons(icons);
  }, []);

  // Filter icons based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredIcons(iconList);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = iconList.filter((icon) => icon.toLowerCase().includes(query));
      setFilteredIcons(filtered);
    }
  }, [searchQuery, iconList]);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="icon-search">Search Icons</Label>
        <Input
          id="icon-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for an icon..."
        />
      </div>

      <div className="h-64 overflow-y-auto border rounded-md p-2">
        <div className="grid grid-cols-5 gap-2">
          {filteredIcons.map((icon) => (
            <motion.div
              key={icon}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`flex flex-col items-center justify-center p-2 cursor-pointer rounded-md ${
                selectedIcon === icon ? "bg-primary/10 border-primary border" : "border"
              }`}
              onClick={() => onSelectIcon(icon)}
            >
              <div className="relative h-8 w-8 flex items-center justify-center">
                <IconPreview iconId={icon} />
                {selectedIcon === icon && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <span className="text-xs text-center mt-1 line-clamp-1">{icon}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper component to display icon preview
function IconPreview({ iconId }: { iconId: string }) {
  const [Icon, setIcon] = useState<React.ComponentType<{ className?: string }> | null>(null);

  useEffect(() => {
    async function loadIcon() {
      try {
        const icon = await getLucideIcon(iconId);
        setIcon(() => icon);
      } catch (error) {
        console.error("Failed to load icon:", error);
      }
    }

    loadIcon();
  }, [iconId]);

  if (Icon) {
    return <Icon className="h-6 w-6" />;
  }

  return <CircleHelp className="h-6 w-6" />;
}

// Theme Settings Tab Component
function ThemeSettingsTab({
  editedSpace,
  updateEditedSpace
}: {
  editedSpace: Space;
  updateEditedSpace: (updates: Partial<Space>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Theme Settings</CardTitle>
        <CardDescription>Configure your space's appearance preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Background Gradient</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-color">Start Color</Label>
              <div className="flex space-x-2">
                <div
                  className="h-9 w-9 rounded-md border"
                  style={{ backgroundColor: editedSpace.bgStartColor || "#ffffff" }}
                />
                <Input
                  id="start-color"
                  type="color"
                  value={editedSpace.bgStartColor || "#ffffff"}
                  onChange={(e) => updateEditedSpace({ bgStartColor: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-color">End Color</Label>
              <div className="flex space-x-2">
                <div
                  className="h-9 w-9 rounded-md border"
                  style={{ backgroundColor: editedSpace.bgEndColor || "#ffffff" }}
                />
                <Input
                  id="end-color"
                  type="color"
                  value={editedSpace.bgEndColor || "#ffffff"}
                  onChange={(e) => updateEditedSpace({ bgEndColor: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div
            className="mt-2 h-20 rounded-md"
            style={{
              background: `linear-gradient(to right, ${editedSpace.bgStartColor || "#ffffff"}, ${editedSpace.bgEndColor || "#ffffff"})`
            }}
          >
            <div className="p-4 flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Preview</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-lg font-medium">Space Icon</h3>
          <LucideIconPicker
            selectedIcon={editedSpace.icon || "Globe"}
            onSelectIcon={(iconId) => updateEditedSpace({ icon: iconId })}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Delete Confirmation Dialog Component
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  spaceName: string;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
}

function DeleteConfirmDialog({ isOpen, onClose, spaceName, isDeleting, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Space</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the space "{spaceName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="gap-2">
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Space Editor Component
function SpaceEditor({ space, onClose, onDelete, onSpacesUpdate }: SpaceEditorProps) {
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

        // For name updates, use updateProfile
        if (updatedFields.name && Object.keys(updatedFields).length === 1) {
          await updateProfile(space.profileId, updatedFields);
        } else {
          // For other updates, use updateSpace
          await updateSpace(space.profileId, space.id, updatedFields);
        }

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
      await deleteSpace(space.profileId, space.id);
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

// ==============================
// Create Space Dialog Component
// ==============================
interface CreateSpaceDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  spaceName: string;
  setSpaceName: (name: string) => void;
  isCreating: boolean;
  onCreate: () => Promise<void>;
}

function CreateSpaceDialog({
  isOpen,
  onClose,
  spaceName,
  setSpaceName,
  isCreating,
  onCreate,
  profiles,
  selectedProfile,
  setSelectedProfile
}: CreateSpaceDialogProps & {
  profiles: Profile[];
  selectedProfile: string | null;
  setSelectedProfile: (id: string | null) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>Enter a name for your new browsing space.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profile-select" className="text-right">
              Profile
            </Label>
            <Select value={selectedProfile ?? ""} onValueChange={setSelectedProfile}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="space-name" className="text-right">
              Name
            </Label>
            <Input
              id="space-name"
              placeholder="Enter space name"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating && spaceName.trim() && selectedProfile) {
                  onCreate();
                }
              }}
              className="col-span-3"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={isCreating || !spaceName.trim() || !selectedProfile} className="gap-2">
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==============================
// Main Spaces Settings Component
// ==============================
export function SpacesSettings() {
  // State management
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  // Fetch spaces and profiles from the API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedProfiles, fetchedSpaces] = await Promise.all([getProfiles(), getSpaces()]);
      setProfiles(fetchedProfiles);
      setSpaces(fetchedSpaces);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle space deletion (local state update)
  const handleDeleteSpace = async (deletedSpace: Space) => {
    // Remove the space from the local state
    setSpaces(spaces.filter((space) => space.id !== deletedSpace.id));
    // The actual deletion is handled in the SpaceEditor component
  };

  // Handle space creation
  const handleCreateSpace = async () => {
    if (!newSpaceName.trim() || !selectedProfile) return;

    setIsCreating(true);
    try {
      // Create space with default theme settings
      const spaceData = {
        name: newSpaceName,
        bgStartColor: "#4285F4",
        bgEndColor: "#34A853",
        icon: "Globe"
      };

      const result = await createSpace(selectedProfile, spaceData.name);
      console.log("Space creation result:", result);

      // Clear the form and close the dialog
      setNewSpaceName("");
      setCreateDialogOpen(false);

      // Refetch spaces to get the latest data
      await fetchData();
    } catch (error) {
      console.error("Failed to create space:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Filter spaces based on selected profile
  const filteredSpaces = selectedProfile ? spaces.filter((space) => space.profileId === selectedProfile) : spaces;

  // Render space editor if a space is active
  if (activeSpace) {
    return (
      <div className="h-full flex flex-col">
        <Card className="flex-1 p-0">
          <CardContent className="p-0">
            <SpaceEditor
              space={activeSpace}
              onClose={() => setActiveSpace(null)}
              onDelete={() => handleDeleteSpace(activeSpace)}
              onSpacesUpdate={fetchData}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render spaces list
  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Browser Spaces</CardTitle>
            <CardDescription className="text-sm">Manage your browsing spaces and their settings</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Space
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-pulse text-muted-foreground">Loading spaces...</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredSpaces.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  No spaces found. Create your first space to get started.
                </div>
              ) : (
                filteredSpaces.map((space) => (
                  <SpaceCard key={space.id} space={space} activateEdit={() => setActiveSpace(space)} />
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Space Dialog */}
      <CreateSpaceDialog
        isOpen={createDialogOpen}
        onClose={setCreateDialogOpen}
        spaceName={newSpaceName}
        setSpaceName={setNewSpaceName}
        isCreating={isCreating}
        onCreate={handleCreateSpace}
        profiles={profiles}
        selectedProfile={selectedProfile}
        setSelectedProfile={setSelectedProfile}
      />
    </div>
  );
}
