import { SettingsTitlebar } from "./settings-titlebar";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";
import { ShortcutsProvider } from "@/components/providers/shortcuts-provider";
import { usePlatform } from "@/components/main/platform";
import { cn } from "@/lib/utils";
import { createContext, useContext, useEffect, useState } from "react";
import { SettingsSidebar } from "./sidebar";
import { BlocksIcon, UsersIcon, KeyboardIcon, Info, LucideIcon, DockIcon, OrbitIcon, CogIcon } from "lucide-react";
import { IconSection } from "./new-sections/icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsContentHeader } from "./content/header";

const FocusedContext = createContext<boolean>(true);
export function useFocusedContext() {
  return useContext(FocusedContext);
}
function useIsFocused() {
  const [isFocused, setIsFocused] = useState(true);
  useEffect(() => {
    function handleFocus() {
      setIsFocused(true);
    }
    function handleBlur() {
      setIsFocused(false);
    }
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);
  return isFocused;
}

export interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  borderCN?: string;
  backgroundCN?: string;
  iconCN?: string;
}
const sections: Section[] = [
  {
    id: "general",
    label: "General",
    icon: CogIcon,
    backgroundCN: cn("bg-linear-to-b from-gray-300 to-gray-400"),
    borderCN: cn("border border-gray-400/80"),
    iconCN: cn("text-black")
  },
  {
    id: "icons",
    label: "Icon",
    icon: DockIcon,
    backgroundCN: cn("bg-linear-to-b from-orange-400 to-orange-500"),
    borderCN: cn("border border-orange-600/60"),
    iconCN: cn("text-white")
  },
  {
    id: "profiles",
    label: "Profiles",
    icon: UsersIcon,
    backgroundCN: cn("bg-linear-to-b from-blue-400 to-blue-600"),
    borderCN: cn("border border-blue-700/60"),
    iconCN: cn("text-white")
  },
  {
    id: "spaces",
    label: "Spaces",
    icon: OrbitIcon,
    backgroundCN: cn("bg-linear-to-b from-violet-400 to-purple-600"),
    borderCN: cn("border border-purple-700/60"),
    iconCN: cn("text-white")
  },
  {
    id: "external-apps",
    label: "External Apps",
    icon: BlocksIcon,
    backgroundCN: cn("bg-linear-to-b from-emerald-400 to-green-600"),
    borderCN: cn("border border-green-700/60"),
    iconCN: cn("text-white")
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    icon: KeyboardIcon,
    backgroundCN: cn("bg-linear-to-b from-pink-400 to-rose-500"),
    borderCN: cn("border border-rose-600/60"),
    iconCN: cn("text-white")
  },
  {
    id: "about",
    label: "About",
    icon: Info,
    backgroundCN: cn("bg-linear-to-b from-sky-400 to-cyan-500"),
    borderCN: cn("border border-cyan-600/60"),
    iconCN: cn("text-white")
  }
];

export function SettingsLayout() {
  const { platform } = usePlatform();

  const [activeSection, setActiveSection] = useState<Section["id"] | null>(null);

  // Whether the settings window is focused, for focus ring etc.
  // This is window-global, so safe to hoist.
  const isFocused = useIsFocused();

  return (
    <FocusedContext.Provider value={isFocused}>
      <AppUpdatesProvider>
        <title>Flow Settings</title>
        <ShortcutsProvider>
          <SettingsProvider>
            <div className="select-none flex flex-col h-screen overflow-hidden bg-background/50 text-gray-600 dark:text-gray-300">
              {platform !== "darwin" && <SettingsTitlebar />}
              {platform === "darwin" && <div className="absolute top-0 w-full h-12 app-drag -z-10" />}
              <div className={cn("flex-1 min-h-0 flex flex-row", platform === "darwin" && "m-2")}>
                <SettingsSidebar
                  sections={sections}
                  activeSection={activeSection}
                  setActiveSection={setActiveSection}
                />
                <div className="relative flex-1 h-full min-w-0">
                  <ScrollArea
                    className={cn("h-full px-2", "mask-[linear-gradient(to_bottom,transparent_36px,black_44px)]")}
                  >
                    <div className="flex flex-col gap-2 pt-11">
                      <IconSection />
                    </div>
                  </ScrollArea>
                  <SettingsContentHeader />
                </div>
              </div>
            </div>
          </SettingsProvider>
        </ShortcutsProvider>
      </AppUpdatesProvider>
    </FocusedContext.Provider>
  );
}
