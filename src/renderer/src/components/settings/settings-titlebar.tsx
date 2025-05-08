"use client";

import { useTranslation } from "react-i18next";

export function SettingsTitlebar() {
  const { t } = useTranslation("settings");

  return (
    <div className="w-full h-10 border-b bg-muted/60 px-4 flex items-center app-drag">
      <span className="font-semibold text-center w-full">{t("Flow Settings")}</span>
    </div>
  );
}
