import { useState, useMemo } from "react";
import { SettingsSidebar } from "./settings-sidebar";
import { SettingsTitlebar } from "./settings-titlebar";
import { GeneralSettings } from "@/components/settings/sections/general/section";
import { IconSettings } from "@/components/settings/sections/icon/section";
import { AboutSettings } from "@/components/settings/sections/about/section";
import { ProfilesSettings } from "@/components/settings/sections/profiles/section";
import { SpacesSettings } from "@/components/settings/sections/spaces/section";
import { ExternalAppsSettings } from "@/components/settings/sections/external-apps/section";
import { KeybindsSettings } from "@/components/settings/sections/keybinds/section";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";
import { Globe, DockIcon, UsersIcon, OrbitIcon, BlocksIcon, Info, KeyboardIcon } from "lucide-react";

export function SettingsLayout() {
  const [activeSection, setActiveSection] = useState("general");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

  const sections = [
    { id: "general", label: "General", icon: <Globe className="h-4 w-4 mr-2" /> },
    { id: "icons", label: "Icon", icon: <DockIcon className="h-4 w-4 mr-2" /> },
    { id: "profiles", label: "Profiles", icon: <UsersIcon className="h-4 w-4 mr-2" /> },
    { id: "spaces", label: "Spaces", icon: <OrbitIcon className="h-4 w-4 mr-2" /> },
    { id: "external-apps", label: "External Apps", icon: <BlocksIcon className="h-4 w-4 mr-2" /> },
    { id: "keybinds", label: "Keybinds", icon: <KeyboardIcon className="h-4 w-4 mr-2" /> },
    { id: "about", label: "About", icon: <Info className="h-4 w-4 mr-2" /> }
  ];

  const navigateToSpaces = (profileId: string) => {
    setSelectedProfileId(profileId);
    setSelectedSpaceId(null);
    setActiveSection("spaces");
  };

  const navigateToSpace = (profileId: string, spaceId: string) => {
    setSelectedProfileId(profileId);
    setSelectedSpaceId(spaceId);
    setActiveSection("spaces");
  };

  const ActiveSectionComponent = useMemo(() => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;
      case "icons":
        return <IconSettings />;
      case "about":
        return <AboutSettings />;
      case "profiles":
        return <ProfilesSettings navigateToSpaces={navigateToSpaces} navigateToSpace={navigateToSpace} />;
      case "spaces":
        return <SpacesSettings initialSelectedProfile={selectedProfileId} initialSelectedSpace={selectedSpaceId} />;
      case "external-apps":
        return <ExternalAppsSettings />;
      case "keybinds":
        return <KeybindsSettings />;
      default:
        return <GeneralSettings />;
    }
  }, [activeSection, selectedProfileId, selectedSpaceId]);

  return (
    <AppUpdatesProvider>
      <SettingsProvider>
        <div className="select-none flex flex-col h-screen bg-background text-gray-600 dark:text-gray-300">
          <SettingsTitlebar />
          <div className="flex flex-1 overflow-hidden">
            <SettingsSidebar activeSection={activeSection} setActiveSection={setActiveSection} sections={sections} />
            <main className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-auto p-6 md:p-8">
                <div className="mx-auto max-w-4xl">{ActiveSectionComponent}</div>
              </div>
            </main>
          </div>
        </div>
      </SettingsProvider>
    </AppUpdatesProvider>
  );
}
