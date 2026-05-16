import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Section } from "./settings-layout";

interface SettingsSidebarSectionButtonProps {
  section: Section;
  activeSection: Section["id"] | null;
  setActiveSection: (section: Section["id"]) => void;
}
function SettingsSidebarSectionButton({ section, activeSection, setActiveSection }: SettingsSidebarSectionButtonProps) {
  return (
    <div
      className={cn(
        "h-8 rounded-lg",
        "flex items-center gap-2",
        "px-2",
        activeSection === section.id && "bg-black/5 dark:bg-white/3"
      )}
      onClick={() => setActiveSection(section.id)}
    >
      <div
        className={cn(
          "size-5.5 flex items-center justify-center",
          "rounded-sm",
          section.borderCN ?? "border border-gray-400",
          section.backgroundCN ?? "bg-gray-300"
        )}
      >
        <section.icon className={cn("size-3.5", section.iconCN ?? "text-black")} />
      </div>
      <span className="text-sm text-black dark:text-white">{section.label}</span>
    </div>
  );
}

interface SettingsSidebarProps {
  isFocused: boolean;
  sections: Section[];
  activeSection: Section["id"] | null;
  setActiveSection: (section: Section["id"]) => void;
}
export function SettingsSidebar({ isFocused, sections, activeSection, setActiveSection }: SettingsSidebarProps) {
  const { platform } = usePlatform();
  const isMac = platform === "darwin";

  return (
    <ScrollArea
      id="sidebar"
      className={cn(
        "w-56.5 h-full",
        isMac ? "rounded-2xl border" : "border-r",
        "overflow-hidden",
        isMac && (isFocused ? "border-white dark:border-border" : "border-transparent"),
        isMac && (isFocused ? "bg-background/50 dark:bg-background/20" : "bg-black/5 dark:bg-white/5")
      )}
    >
      <div className="p-2 flex flex-col gap-2">
        <div className="sticky top-2 z-20">
          {/* Window controls */}
          {isMac && (
            <div className="h-4.5 w-full shrink-0 flex items-center gap-2 px-[3px]">
              <SidebarWindowControlsMacOS />
            </div>
          )}
        </div>
        {/* Sidebar content */}
        <div className="flex flex-col gap-px">
          {sections.map((section) => (
            <SettingsSidebarSectionButton
              key={section.id}
              section={section}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
