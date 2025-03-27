import { useState, useMemo } from "react";
import { SettingsTopbar } from "@/components/settings/settings-topbar";
import { GeneralSettings } from "@/components/settings/sections/general-settings";
import { AboutSettings } from "@/components/settings/sections/about-settings";

export function SettingsLayout() {
  const [activeSection, setActiveSection] = useState("general");

  const ActiveSection = useMemo(() => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;
      case "about":
        return <AboutSettings />;
      default:
        return <GeneralSettings />;
    }
  }, [activeSection]);

  return (
    <div className="flex flex-col h-screen bg-background text-gray-600 dark:text-gray-300">
      <SettingsTopbar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl">{ActiveSection}</div>
      </div>
    </div>
  );
}
