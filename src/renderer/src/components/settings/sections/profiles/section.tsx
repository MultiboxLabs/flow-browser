import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import type { Profile } from "~/flow/interfaces/sessions/profiles";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import { Trash2, ArrowLeft, Settings, Globe, Save, Loader2, Plus, Box } from "lucide-react";
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
import { useEffect, useState } from "react";

// ==============================
// Profile Card Component
// ==============================
interface ProfileCardProps {
  profile: Profile;
  activateEdit: () => void;
}

function ProfileCard({ profile, activateEdit }: ProfileCardProps) {
  return (
    <motion.div
      key={profile.id}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="flex items-center border rounded-lg p-4 cursor-pointer hover:border-primary/50"
      onClick={() => activateEdit()}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base truncate">{profile.name}</h3>
        <p className="text-xs text-muted-foreground truncate">ID: {profile.id}</p>
      </div>
    </motion.div>
  );
}

// ==============================
// Profile Editor Components
// ==============================
interface ProfileEditorProps {
  profile: Profile;
  onClose: () => void;
  onDelete: () => void;
  onProfilesUpdate: () => void;
  navigateToSpaces?: (profileId: string) => void;
  navigateToSpace?: (profileId: string, spaceId: string) => void;
}

// Basic Settings Tab Component
interface BasicSettingsTabProps {
  profile: Profile;
  editedProfile: Profile;
  handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function BasicSettingsTab({ profile, editedProfile, handleNameChange }: BasicSettingsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Basic Information</CardTitle>
        <CardDescription>{"Manage your profile's basic settings"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Profile Name</Label>
          <Input
            id="profile-name"
            value={editedProfile.name}
            onChange={handleNameChange}
            placeholder="Enter profile name"
          />
        </div>

        <div className="space-y-2">
          <Label>Profile ID</Label>
          <div className="p-2 bg-muted rounded-md text-sm">{profile.id}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// Search Settings Tab Component
function SearchSettingsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Search Engines</CardTitle>
        <CardDescription>Configure your search engines preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md bg-muted p-4 text-sm">
          <p className="text-muted-foreground">
            Search engine settings are coming soon. This feature is currently in development.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Spaces Tab Component
interface SpacesTabProps {
  profile: Profile;
  spaces: Space[];
  onRefreshSpaces: () => void;
  navigateToSpace?: (profileId: string, spaceId: string) => void;
}

function SpacesTab({ profile, spaces, onRefreshSpaces, navigateToSpace }: SpacesTabProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Handle space creation
  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) return;

    setIsCreating(true);
    try {
      await flow.spaces.createSpace(profile.id, newSpaceName);
      setNewSpaceName("");
      setCreateDialogOpen(false);
      onRefreshSpaces();
    } catch (error) {
      console.error("Failed to create space:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Spaces</CardTitle>
          <CardDescription>Manage spaces in this profile</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> New Space
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {spaces.length === 0 ? (
          <div className="text-center p-6 text-muted-foreground">
            No spaces found. Create your first space to get started.
          </div>
        ) : (
          <div className="grid gap-3">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="flex items-center justify-between border rounded p-3 hover:border-primary/50 cursor-pointer"
                onClick={navigateToSpace ? () => navigateToSpace(profile.id, space.id) : undefined}
              >
                <div className="flex items-center space-x-3">
                  <Box className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{space.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {space.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Space Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Space</DialogTitle>
              <DialogDescription>{`Enter a name for the new space in profile "${profile.name}".`}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="space-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="space-name"
                  placeholder="Enter space name"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isCreating && newSpaceName.trim()) {
                      handleCreateSpace();
                    }
                  }}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreateSpace} disabled={isCreating || !newSpaceName.trim()} className="gap-2">
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
      </CardContent>
    </Card>
  );
}

// Delete Confirmation Dialog Component
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  profileName: string;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
}

function DeleteConfirmDialog({ isOpen, onClose, profileName, isDeleting, onConfirm }: DeleteConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Profile</DialogTitle>
          <DialogDescription>
            {`Are you sure you want to delete the profile "${profileName}"? This action cannot be undone.`}
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

// Main Profile Editor Component
function ProfileEditor({
  profile,
  onClose,
  onDelete,
  onProfilesUpdate,
  navigateToSpace
}: ProfileEditorProps & {
  navigateToSpace?: (profileId: string, spaceId: string) => void;
}) {
  // State management
  const [editedProfile, setEditedProfile] = useState<Profile>({ ...profile });
  const [activeTab, setActiveTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLastProfile, setIsLastProfile] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);

  // Check if this is the last remaining profile
  useEffect(() => {
    const checkProfileCount = async () => {
      try {
        const allProfiles = await flow.profiles.getProfiles();
        setIsLastProfile(allProfiles.length <= 1);
      } catch (error) {
        console.error("Failed to check profile count:", error);
      }
    };

    checkProfileCount();
  }, []);

  // Load spaces for this profile
  useEffect(() => {
    const fetchSpaces = async () => {
      setLoadingSpaces(true);
      try {
        const profileSpaces = await flow.spaces.getSpacesFromProfile(profile.id);
        setSpaces(profileSpaces);
      } catch (error) {
        console.error("Failed to fetch spaces:", error);
      } finally {
        setLoadingSpaces(false);
      }
    };

    fetchSpaces();
  }, [profile.id]);

  const refreshSpaces = async () => {
    setLoadingSpaces(true);
    try {
      const profileSpaces = await flow.spaces.getSpacesFromProfile(profile.id);
      setSpaces(profileSpaces);
    } catch (error) {
      console.error("Failed to refresh spaces:", error);
    } finally {
      setLoadingSpaces(false);
    }
  };

  // Handle profile update
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Only send the fields that have changed
      const updatedFields: Partial<Profile> = {};
      if (editedProfile.name !== profile.name) {
        updatedFields.name = editedProfile.name;
      }

      if (Object.keys(updatedFields).length > 0) {
        console.log("Updating profile:", profile.id, updatedFields);
        await flow.profiles.updateProfile(profile.id, updatedFields);
        onProfilesUpdate(); // Refetch profiles after successful update
      }
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle profile deletion with confirmation
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await flow.profiles.deleteProfile(profile.id);
      onDelete();
      onClose();
    } catch (error) {
      console.error("Failed to delete profile:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle input field changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedProfile({
      ...editedProfile,
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
          <h2 className="text-lg font-medium">Edit Profile</h2>
          <p className="text-sm text-muted-foreground">Customize your browsing profile</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="gap-1"
            disabled={isLastProfile}
            title={isLastProfile ? "Cannot delete the last remaining profile" : "Delete profile"}
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
              variant={activeTab === "spaces" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("spaces")}
            >
              <Box className="mr-2 h-5 w-5" />
              Spaces
            </Button>
            <Button
              variant={activeTab === "search" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("search")}
            >
              <Globe className="mr-2 h-5 w-5" />
              Search Engines
            </Button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === "basic" && (
            <div className="space-y-6">
              <BasicSettingsTab profile={profile} editedProfile={editedProfile} handleNameChange={handleNameChange} />
            </div>
          )}

          {activeTab === "spaces" && (
            <div className="space-y-6">
              {loadingSpaces ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-pulse text-muted-foreground">Loading spaces...</div>
                </div>
              ) : (
                <SpacesTab
                  profile={profile}
                  spaces={spaces}
                  onRefreshSpaces={refreshSpaces}
                  navigateToSpace={navigateToSpace}
                />
              )}
            </div>
          )}

          {activeTab === "search" && (
            <div className="space-y-6">
              <SearchSettingsTab />
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen && !isLastProfile}
        onClose={setDeleteDialogOpen}
        profileName={profile.name}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

// ==============================
// Create Profile Dialog Component
// ==============================
interface CreateProfileDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  profileName: string;
  setProfileName: (name: string) => void;
  isCreating: boolean;
  onCreate: () => Promise<void>;
}

function CreateProfileDialog({
  isOpen,
  onClose,
  profileName,
  setProfileName,
  isCreating,
  onCreate
}: CreateProfileDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Profile</DialogTitle>
          <DialogDescription>Enter a name for your new browser profile.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="profile-name" className="text-right">
              Name
            </Label>
            <Input
              id="profile-name"
              placeholder="Enter profile name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating && profileName.trim()) {
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
          <Button onClick={onCreate} disabled={isCreating || !profileName.trim()} className="gap-2">
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
// Main Profiles Settings Component
// ==============================
export interface ProfilesSettingsProps {
  navigateToSpaces?: (profileId: string) => void;
  navigateToSpace?: (profileId: string, spaceId: string) => void;
}

export function ProfilesSettings({ navigateToSpaces, navigateToSpace }: ProfilesSettingsProps) {
  // State management
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch profiles from the API
  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const fetchedProfiles = await flow.profiles.getProfiles();
      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load profiles on component mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Handle profile deletion (local state update)
  const handleDeleteProfile = async (deletedProfile: Profile) => {
    // Remove the profile from the local state
    setProfiles(profiles.filter((profile) => profile.id !== deletedProfile.id));
    // The actual deletion is handled in the ProfileEditor component
  };

  // Handle profile creation
  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;

    setIsCreating(true);
    try {
      const result = await flow.profiles.createProfile(newProfileName);
      console.log("Profile creation result:", result);

      // Clear the form and close the dialog
      setNewProfileName("");
      setCreateDialogOpen(false);

      // Refetch profiles to get the latest data
      await fetchProfiles();
    } catch (error) {
      console.error("Failed to create profile:", error);
    } finally {
      setIsCreating(false);
    }
  };

  // Render profile editor if a profile is active
  if (activeProfile) {
    return (
      <div className="h-full flex flex-col">
        <Card className="flex-1 p-0">
          <CardContent className="p-0">
            <ProfileEditor
              profile={activeProfile}
              onClose={() => setActiveProfile(null)}
              onDelete={() => handleDeleteProfile(activeProfile)}
              onProfilesUpdate={fetchProfiles}
              navigateToSpaces={navigateToSpaces}
              navigateToSpace={navigateToSpace}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render profiles list
  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Browser Profiles</CardTitle>
            <CardDescription className="text-sm">Manage your browser profiles and their settings</CardDescription>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Profile
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-pulse text-muted-foreground">Loading profiles...</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {profiles.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  No profiles found. Create your first profile to get started.
                </div>
              ) : (
                profiles.map((profile) => (
                  <ProfileCard key={profile.id} profile={profile} activateEdit={() => setActiveProfile(profile)} />
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Profile Dialog */}
      <CreateProfileDialog
        isOpen={createDialogOpen}
        onClose={setCreateDialogOpen}
        profileName={newProfileName}
        setProfileName={setNewProfileName}
        isCreating={isCreating}
        onCreate={handleCreateProfile}
      />
    </div>
  );
}
