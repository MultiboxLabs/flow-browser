import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical } from "lucide-react";
import { SpaceCard } from "./space-card";
import { UILayer } from "~/layers";
import { SpaceEditor } from "./space-editor";
import { CreateSpaceDialog } from "./space-dialogs";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import type { Profile } from "~/flow/interfaces/sessions/profiles";
import { Reorder, useDragControls } from "motion/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ==============================
// Main Spaces Settings Component
// ==============================
export interface SpacesSettingsProps {
  initialSelectedProfile?: string | null;
  initialSelectedSpace?: string | null;
}

export function SpacesSettings({ initialSelectedProfile, initialSelectedSpace }: SpacesSettingsProps) {
  // State management
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(initialSelectedProfile || null);

  // Use the initialSelectedProfile when it changes
  useEffect(() => {
    if (initialSelectedProfile) {
      setSelectedProfile(initialSelectedProfile);
    }
  }, [initialSelectedProfile]);

  // Fetch spaces and profiles from the API
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fetchedProfiles, fetchedSpaces] = await Promise.all([
        flow.profiles.getProfiles(),
        flow.spaces.getSpaces()
      ]);
      setProfiles(fetchedProfiles);
      setSpaces(fetchedSpaces);

      // Set active space if initialSelectedSpace is provided
      if (initialSelectedSpace) {
        const selectedSpace = fetchedSpaces.find((space) => space.id === initialSelectedSpace);
        if (selectedSpace) {
          setActiveSpace(selectedSpace);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set active space when initialSelectedSpace changes
  useEffect(() => {
    if (initialSelectedSpace && spaces.length > 0) {
      const selectedSpace = spaces.find((space) => space.id === initialSelectedSpace);
      if (selectedSpace) {
        setActiveSpace(selectedSpace);
      }
    }
  }, [initialSelectedSpace, spaces]);

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

      const result = await flow.spaces.createSpace(selectedProfile, spaceData.name);
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

  // Handle space reordering
  const handleReorder = async (reorderedSpaces: Space[]) => {
    setSpaces(reorderedSpaces);

    // Prepare order map for the API
    const orderMap = reorderedSpaces.map((space, index) => ({
      profileId: space.profileId,
      spaceId: space.id,
      order: index
    }));

    try {
      // Call the API to persist the new order
      await flow.spaces.reorderSpaces(orderMap);
    } catch (error) {
      console.error("Failed to reorder spaces:", error);
    }
  };

  // Filter spaces based on selected profile
  const filteredSpaces = selectedProfile ? spaces.filter((space) => space.profileId === selectedProfile) : spaces;

  // Get selected profile name for display
  const selectedProfileName = selectedProfile
    ? profiles.find((p) => p.id === selectedProfile)?.name || "Selected Profile"
    : "All Profiles";

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
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="text-lg">
                {selectedProfile ? `Spaces for ${selectedProfileName}` : "All Browser Spaces"}
              </CardTitle>
              <CardDescription className="text-sm">Manage your browsing spaces and their settings</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedProfile || "all"}
              onValueChange={(value) => setSelectedProfile(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select profile" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Profiles</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setCreateDialogOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Space
            </Button>
          </div>
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
                <Reorder.Group
                  axis="y"
                  values={filteredSpaces}
                  onReorder={handleReorder}
                  className="flex flex-col gap-4"
                  layoutScroll
                  layout
                  transition={{
                    type: "spring",
                    bounce: 0.1,
                    duration: 0.3
                  }}
                >
                  {filteredSpaces.map((space) => (
                    <DraggableSpaceCard key={space.id} space={space} activateEdit={() => setActiveSpace(space)} />
                  ))}
                </Reorder.Group>
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

// DraggableSpaceCard component for reordering
interface DraggableSpaceCardProps {
  space: Space;
  activateEdit: () => void;
}

function DraggableSpaceCard({ space, activateEdit }: DraggableSpaceCardProps) {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragControls.start(event);
  };

  return (
    <Reorder.Item
      value={space}
      dragControls={dragControls}
      className="list-none"
      whileDrag={{
        scale: 1.02,
        zIndex: UILayer.ELEVATED
      }}
      dragListener={false}
      onDragEnd={() => setIsDragging(false)}
      transition={{
        type: "spring",
        stiffness: 700,
        damping: 30,
        mass: 0.8
      }}
    >
      <div className={`flex items-center ${isDragging ? "opacity-95" : "opacity-100"}`}>
        <div
          className={`p-2 ${isDragging ? "cursor-grabbing" : "cursor-grab"} touch-none`}
          onPointerDown={handleDragStart}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <SpaceCard space={space} activateEdit={activateEdit} />
        </div>
      </div>
    </Reorder.Item>
  );
}
