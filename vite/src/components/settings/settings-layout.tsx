import { useState, useEffect } from "react";
import { SettingsTopbar } from "@/components/settings/settings-topbar";
import { GeneralSettings } from "@/components/settings/sections/general-settings";
import { AppearanceSettings } from "@/components/settings/sections/appearance-settings";
import { PrivacySettings } from "@/components/settings/sections/privacy-settings";
import { SearchSettings } from "@/components/settings/sections/search-settings";
import { ExtensionsSettings } from "@/components/settings/sections/extensions-settings";
import { AboutSettings } from "@/components/settings/sections/about-settings";

export function SettingsLayout() {
  const [activeSection, setActiveSection] = useState("general");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // Apply theme based on selection
  useEffect(() => {
    const root = document.documentElement;

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;
      case "appearance":
        return <AppearanceSettings theme={theme} setTheme={setTheme} />;
      case "privacy":
        return <PrivacySettings />;
      case "search":
        return <SearchSettings />;
      case "extensions":
        return <ExtensionsSettings />;
      case "about":
        return <AboutSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-gray-600 dark:text-gray-300">
      <SettingsTopbar activeSection={activeSection} setActiveSection={setActiveSection} />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl">{renderSection()}</div>
      </div>
    </div>
  );
}
