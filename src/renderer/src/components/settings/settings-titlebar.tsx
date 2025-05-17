"use client";

import { useSettingsTranslations } from "@/lib/i18n";

export function SettingsTitlebar() {
  const { t: tSettings } = useSettingsTranslations();

  return (
    <div className="w-full h-10 border-b bg-muted/60 px-4 flex items-center app-drag">
      <span className="font-semibold text-center w-full">{tSettings("title")}</span>
    </div>
  );
}
