import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Section } from "./settings-layout";
import { useSettingsWindowContext } from "./context";

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

export function getLiquidGlassLikeStyles(isFocused: boolean) {
  return cn(
    isFocused ? "border-white dark:border-border" : "border-transparent",
    isFocused ? "bg-background/50 dark:bg-background/20" : "bg-black/10 dark:bg-white/5"
  );
}

interface SettingsSidebarProps {
  sections: Section[];
  activeSection: Section["id"] | null;
  setActiveSection: (section: Section["id"]) => void;
}
export function SettingsSidebar({ sections, activeSection, setActiveSection }: SettingsSidebarProps) {
  const { isMac, isFocused } = useSettingsWindowContext();

  return (
    <ScrollArea
      id="sidebar"
      className={cn(
        "w-56.5 h-full",
        isMac ? "rounded-2xl border" : "border-r",
        "overflow-hidden",
        isMac && getLiquidGlassLikeStyles(isFocused)
      )}
    >
      <div className="p-2 flex flex-col gap-2">
        {isMac && (
          <div className="sticky top-2 z-20">
            {/* Window controls */}
            <div className="h-4.5 w-full shrink-0 flex items-center gap-2 px-[3px]">
              <SidebarWindowControlsMacOS />
            </div>
          </div>
        )}
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
