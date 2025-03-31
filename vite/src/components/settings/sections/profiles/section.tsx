import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { getProfiles } from "@/lib/flow";
import type { Profile } from "@/lib/flow";
import { getLucideIcon } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { CircleHelpIcon, Trash2, ArrowLeft, Settings, Palette, Globe, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ProfileCard({ profile, activateEdit }: { profile: Profile; activateEdit: () => void }) {
  const [Icon, setIcon] = useState<LucideIcon>(CircleHelpIcon);

  useEffect(() => {
    getLucideIcon(profile.iconId).then(setIcon);
  }, [profile.iconId]);

  return (
    <motion.div
      key={profile.id}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="flex items-center border rounded-lg p-4 cursor-pointer hover:border-primary/50"
      onClick={() => activateEdit()}
    >
      <div
        className="h-12 w-12 rounded-lg mr-4 flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${profile.bgGradient[0]}, ${profile.bgGradient[1]})`
        }}
      >
        <div className="h-full w-full flex items-center justify-center text-white font-semibold">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base truncate">{profile.name}</h3>
      </div>
    </motion.div>
  );
}

interface ProfileEditorProps {
  profile: Profile;
  onClose: () => void;
  onDelete: () => void;
}

function ProfileEditor({ profile, onClose, onDelete }: ProfileEditorProps) {
  const [editedProfile, setEditedProfile] = useState<Profile>({ ...profile });
  const [Icon, setIcon] = useState<LucideIcon>(CircleHelpIcon);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    getLucideIcon(editedProfile.iconId).then(setIcon);
  }, [editedProfile.iconId]);

  const handleSave = async () => {
    // For now, we're just mocking the save functionality
    console.log("Saving profile:", editedProfile);
    onClose();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedProfile({
      ...editedProfile,
      name: e.target.value
    });
  };

  const handleColorChange = (index: number, color: string) => {
    const newGradient = [...editedProfile.bgGradient];
    newGradient[index] = color;
    setEditedProfile({
      ...editedProfile,
      bgGradient: newGradient
    });
  };

  const handleIconChange = async (iconId: string) => {
    setEditedProfile({
      ...editedProfile,
      iconId
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
          <Button variant="default" size="sm" onClick={handleSave} className="gap-1">
            <Save className="h-4 w-4" />
            Save
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
              variant={activeTab === "appearance" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("appearance")}
            >
              <Palette className="mr-2 h-5 w-5" />
              Appearance
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

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Appearance</CardTitle>
                  <CardDescription>Customize how your profile looks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Profile Icon</Label>
                    <div className="flex items-center space-x-4">
                      <div
                        className="h-16 w-16 rounded-lg flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${editedProfile.bgGradient[0]}, ${editedProfile.bgGradient[1]})`
                        }}
                      >
                        <div className="h-full w-full flex items-center justify-center text-white">
                          <Icon className="h-8 w-8" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm">Current Icon: {editedProfile.iconId}</p>
                        <div className="flex flex-wrap gap-2">
                          {["orbit", "globe", "home", "star", "search"].map((iconId) => (
                            <Button
                              key={iconId}
                              variant="outline"
                              size="sm"
                              className={editedProfile.iconId === iconId ? "border-primary" : ""}
                              onClick={() => handleIconChange(iconId)}
                            >
                              {iconId}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Gradient Colors</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="start-color">Start Color</Label>
                          <div className="text-sm text-muted-foreground">{editedProfile.bgGradient[0]}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded border"
                            style={{ backgroundColor: editedProfile.bgGradient[0] }}
                          />
                          <Input
                            id="start-color"
                            type="color"
                            value={editedProfile.bgGradient[0]}
                            onChange={(e) => handleColorChange(0, e.target.value)}
                            className="w-full h-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="end-color">End Color</Label>
                          <div className="text-sm text-muted-foreground">{editedProfile.bgGradient[1]}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-8 w-8 rounded border"
                            style={{ backgroundColor: editedProfile.bgGradient[1] }}
                          />
                          <Input
                            id="end-color"
                            type="color"
                            value={editedProfile.bgGradient[1]}
                            onChange={(e) => handleColorChange(1, e.target.value)}
                            className="w-full h-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-4 rounded-lg mt-4"
                      style={{
                        background: `linear-gradient(135deg, ${editedProfile.bgGradient[0]}, ${editedProfile.bgGradient[1]})`
                      }}
                    >
                      <div className="text-white text-center font-medium">Preview</div>
                    </div>
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

  useEffect(() => {
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

    fetchProfiles();
  }, []);

  const handleDeleteProfile = (deletedProfile: Profile) => {
    setProfiles(profiles.filter((profile) => profile.id !== deletedProfile.id));
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
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Browser Profiles</CardTitle>
          <CardDescription className="text-sm">Manage your browser profiles and their settings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-pulse text-muted-foreground">Loading profiles...</div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} activateEdit={() => setActiveProfile(profile)} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
