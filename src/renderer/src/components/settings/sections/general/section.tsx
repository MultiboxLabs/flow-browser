import { BasicSettingsCards } from "@/components/settings/sections/general/basic-settings-cards";
import { useSettingsTranslations } from "@/lib/i18n";

export function GeneralSettings() {
  const { t } = useSettingsTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">{t("General")}</h2>
        <p className="text-muted-foreground">{t("Manage your browser's general settings")}</p>
      </div>

      <BasicSettingsCards />
    </div>
  );
}
