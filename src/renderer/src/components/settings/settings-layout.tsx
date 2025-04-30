import { useState, useMemo } from "react";
import { SettingsTopbar } from "@/components/settings/settings-topbar";
import { GeneralSettings } from "@/components/settings/sections/general/section";
import { IconSettings } from "@/components/settings/sections/icon/section";
import { AboutSettings } from "@/components/settings/sections/about/section";
import { ProfilesSettings } from "@/components/settings/sections/profiles/section";
import { SpacesSettings } from "@/components/settings/sections/spaces/section";
import { ExternalAppsSettings } from "@/components/settings/sections/external-apps/section";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";

export function SettingsLayout() {
  const [activeSection, setActiveSection] = useState("general");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);

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

  const ActiveSection = useMemo(() => {
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
      default:
        return <GeneralSettings />;
    }
  }, [activeSection, selectedProfileId, selectedSpaceId]);

  return (
    <AppUpdatesProvider>
      <SettingsProvider>
        <div className="select-none flex flex-col h-screen bg-background text-gray-600 dark:text-gray-300">
          <SettingsTopbar activeSection={activeSection} setActiveSection={setActiveSection} />
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="mx-auto max-w-3xl">{ActiveSection}</div>
          </div>
        </div>
      </SettingsProvider>
    </AppUpdatesProvider>
  );
}
