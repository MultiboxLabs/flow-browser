import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { createProfile, getProfiles, updateProfile } from "@/lib/flow";
import type { Profile } from "@/lib/flow";
import { Trash2, ArrowLeft, Settings, Globe, Save, Loader2, Plus } from "lucide-react";
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

function ProfileCard({ profile, activateEdit }: { profile: Profile; activateEdit: () => void }) {
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

interface ProfileEditorProps {
  profile: Profile;
  onClose: () => void;
  onDelete: () => void;
  onProfilesUpdate: () => void;
}

function ProfileEditor({ profile, onClose, onDelete, onProfilesUpdate }: ProfileEditorProps) {
  const [editedProfile, setEditedProfile] = useState<Profile>({ ...profile });
  const [activeTab, setActiveTab] = useState("basic");
  const [isSaving, setIsSaving] = useState(false);

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
        await updateProfile(profile.id, updatedFields);
        onProfilesUpdate(); // Refetch profiles after successful update
      }
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedProfile({
      ...editedProfile,
      name: e.target.value
    });
  };

  return (
    <div className="z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center border-b p-4">
        <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-medium">Edit Profile</h2>
          <p className="text-sm text-muted-foreground">Customize your browsing profile</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={onDelete} className="gap-1">
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

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
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
              variant={activeTab === "search" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("search")}
            >
              <Globe className="mr-2 h-5 w-5" />
              Search Engines
            </Button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === "basic" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Basic Information</CardTitle>
                  <CardDescription>Manage your profile's basic settings</CardDescription>
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
                    <div className="p-2 bg-muted rounded-md text-sm">{editedProfile.id}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "search" && (
            <div className="space-y-6">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProfilesSettings() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      const fetchedProfiles = await getProfiles();
      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleDeleteProfile = (deletedProfile: Profile) => {
    setProfiles(profiles.filter((profile) => profile.id !== deletedProfile.id));
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) return;

    setIsCreating(true);
    try {
      const result = await createProfile(newProfileName);
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
            />
          </CardContent>
        </Card>
      </div>
    );
  }

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

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
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
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isCreating && newProfileName.trim()) {
                    handleCreateProfile();
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
            <Button onClick={handleCreateProfile} disabled={isCreating || !newProfileName.trim()} className="gap-2">
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
    </div>
  );
}
