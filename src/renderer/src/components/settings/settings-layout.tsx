import { SettingsTitlebar } from "./settings-titlebar";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";
import { ShortcutsProvider } from "@/components/providers/shortcuts-provider";
import { usePlatform } from "@/components/main/platform";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { SettingsSidebar } from "./sidebar";
import { BlocksIcon, UsersIcon, KeyboardIcon, Info, LucideIcon, DockIcon, OrbitIcon, CogIcon } from "lucide-react";
import { IconSection } from "./new-sections/icon/section";
import { GeneralSection } from "./new-sections/general";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsContentHeader } from "./components/content/header";
import { SettingsWindowProvider, useSettingsWindowContext } from "./context";

export interface Section {
  id: string;
  label: string;
  icon: LucideIcon;
  borderCN?: string;
  backgroundCN?: string;
  iconCN?: string;
  section?: React.ReactNode;
}
const sections: Section[] = [
  {
    id: "general",
    label: "General",
    icon: CogIcon,
    backgroundCN: cn("bg-linear-to-b from-gray-300 to-gray-400"),
    borderCN: cn("border border-gray-400/80"),
    iconCN: cn("text-black"),
    section: <GeneralSection />
  },
  {
    id: "icons",
    label: "Icon",
    icon: DockIcon,
    backgroundCN: cn("bg-linear-to-b from-orange-400 to-orange-500"),
    borderCN: cn("border border-orange-600/60"),
    iconCN: cn("text-white"),
    section: <IconSection />
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

function InnerSettingsLayout() {
  const { platform } = usePlatform();

  const { navigationHistory, navigationHistoryIndex, push } = useSettingsWindowContext();
  const currentEntry = navigationHistory[navigationHistoryIndex];
  const sectionData = currentEntry ? (sections.find((s) => s.id === currentEntry.section) ?? null) : null;
  const sectionId = currentEntry ? currentEntry.section : null;
  const sectionLabel = sectionData ? sectionData.label : null;
  const currentSectionNode = currentEntry?.component;

  const setActiveSection = useCallback(
    (nextSectionId: Section["id"]) => {
      const section = sections.find((s) => s.id === nextSectionId);
      if (!section) return;
      if (currentEntry.section === nextSectionId && currentEntry.isSectionRoot) return;
      push({
        section: section.id,
        component: section.section,
        isSectionRoot: true
      });
    },
    [push, currentEntry]
  );

  return (
    <AppUpdatesProvider>
      <title>Flow Settings</title>
      <ShortcutsProvider>
        <SettingsProvider>
          <div
            className={cn(
              "select-none",
              "flex flex-col h-screen overflow-hidden",
              "bg-background/50 text-black dark:text-white"
            )}
          >
            {platform !== "darwin" && <SettingsTitlebar />}
            {platform === "darwin" && <div className="absolute top-0 w-full h-12 app-drag -z-10" />}
            <div className={cn("flex-1 min-h-0 flex flex-row", platform === "darwin" && "m-2")}>
              <SettingsSidebar sections={sections} activeSection={sectionId} setActiveSection={setActiveSection} />
              <div className="relative flex-1 h-full min-w-0">
                <ScrollArea
                  className={cn("h-full px-2", "mask-[linear-gradient(to_bottom,transparent_36px,black_44px)]")}
                  disableTabFocus
                >
                  <div className="flex flex-col gap-2 pt-11 px-2 pb-4">{currentSectionNode}</div>
                </ScrollArea>
                <SettingsContentHeader sectionLabel={sectionLabel} />
              </div>
            </div>
          </div>
        </SettingsProvider>
      </ShortcutsProvider>
    </AppUpdatesProvider>
  );
}

export function SettingsLayout() {
  return (
    <SettingsWindowProvider
      initialItem={{
        section: sections[0].id,
        component: sections[0].section,
        isSectionRoot: true
      }}
    >
      <InnerSettingsLayout />
    </SettingsWindowProvider>
  );
}
