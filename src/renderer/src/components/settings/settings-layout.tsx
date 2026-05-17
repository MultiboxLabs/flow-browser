import { SettingsTitlebar } from "./settings-titlebar";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";
import { ShortcutsProvider } from "@/components/providers/shortcuts-provider";
import { usePlatform } from "@/components/main/platform";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { SettingsSidebar } from "./sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsContentHeader } from "./components/content/header";
import { SettingsWindowProvider, useSettingsWindowContext } from "./context";
import { sections, type Section } from "./sections";
import { useSettingsHeaderTitleScroll } from "./use-settings-header-title-scroll";

function InnerSettingsLayout() {
  const { platform } = usePlatform();

  const { navigationHistory, navigationHistoryIndex, push } = useSettingsWindowContext();
  const currentEntry = navigationHistory[navigationHistoryIndex];
  const sectionData = currentEntry ? (sections.find((s) => s.id === currentEntry.section) ?? null) : null;
  const sectionId = currentEntry ? currentEntry.section : null;
  const sectionHeaderTitleMode = sectionData?.sectionHeaderTitleMode ?? "showOnScroll";
  const sectionLabel = sectionData ? sectionData.label : null;
  const currentSectionNode = currentEntry?.component;

  const { viewportRef: scrollViewportRef, headerTitleFromScroll } = useSettingsHeaderTitleScroll({
    sectionHeaderTitleMode,
    sectionId,
    currentSectionNode
  });

  const contentHeaderSectionLabel =
    sectionLabel == null || sectionHeaderTitleMode === "none"
      ? null
      : sectionHeaderTitleMode === "showAlways"
        ? sectionLabel
        : headerTitleFromScroll
          ? sectionLabel
          : null;

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
                  viewportRef={scrollViewportRef}
                >
                  <div className="flex flex-col gap-2 pt-11 px-2 pb-4">{currentSectionNode}</div>
                </ScrollArea>
                <SettingsContentHeader sectionLabel={contentHeaderSectionLabel} />
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
