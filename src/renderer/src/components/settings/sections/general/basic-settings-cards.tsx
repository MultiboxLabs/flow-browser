import { useSettings } from "@/components/providers/settings-provider";
import { CustomSearchEngineFields } from "@/components/search/custom-search-engine-fields";
import { BasicSetting, BasicSettingCard } from "~/types/settings";
import type { CustomSearchSuggestionsProviderId } from "@/lib/omnibox-new/search-providers";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ResetOnboardingCard } from "@/components/settings/sections/general/reset-onboarding-card";
import { UpdateCard } from "@/components/settings/sections/general/update-card";
import { SetAsDefaultBrowserSetting } from "@/components/settings/sections/general/set-as-default-browser-setting";
import { TooltipProvider } from "@/components/ui/tooltip";

export function SettingsInput({ setting }: { setting: BasicSetting }) {
  const { getSetting, setSetting } = useSettings();

  const handleSettingChange = (value: BasicSetting["defaultValue"]) => {
    setSetting(setting.id, value);
  };

  if (setting.type === "enum") {
    const settingValue = getSetting<string>(setting.id);
    return (
      <div className={cn(setting.showName === false ? "w-full" : "w-auto")}>
        <Select value={settingValue} onValueChange={handleSettingChange}>
          <SelectTrigger className="w-full min-w-45">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="remove-app-drag z-popover">
            {setting.options.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  } else if (setting.type === "boolean") {
    const settingValue = getSetting<boolean>(setting.id);
    return <Switch checked={settingValue} onCheckedChange={handleSettingChange} />;
  } else if (setting.type === "string") {
    const settingValue = getSetting<string>(setting.id);
    return (
      <Input
        value={settingValue ?? ""}
        placeholder={setting.placeholder}
        onChange={(event) => handleSettingChange(event.target.value)}
        className="min-w-70"
      />
    );
  }

  return null;
}

export function BasicSettingsCard({ card, transparent }: { card: BasicSettingCard; transparent?: boolean }) {
  const { settings, getSetting, setSetting } = useSettings();
  const selectedSearchEngine = getSetting<string>("searchEngine");
  const isCustomSearchSelected = selectedSearchEngine === "custom";

  if (card.title === "INTERNAL_UPDATE") {
    return <UpdateCard />;
  } else if (card.title === "INTERNAL_ONBOARDING") {
    return <ResetOnboardingCard />;
  }

  return (
    <TooltipProvider>
      <div className={cn("remove-app-drag rounded-lg border p-6", transparent ? "bg-muted/30" : "bg-card")}>
        <div className="mb-4">
          <h3 className="text-xl font-semibold tracking-tight text-card-foreground">{card.title}</h3>
          {card.subtitle && <p className="text-sm text-muted-foreground mt-1">{card.subtitle}</p>}
        </div>
        <div className="space-y-4">
          {card.settings.map((settingId) => {
            if (settingId === "internal_setAsDefaultBrowser") {
              return <SetAsDefaultBrowserSetting key={settingId} />;
            }

            if (
              (settingId === "customSearchUrlTemplate" || settingId === "customSearchSuggestionsProvider") &&
              !isCustomSearchSelected
            ) {
              return null;
            }

            const setting = settings.find((s) => s.id === settingId);
            if (!setting) return null;
            const settingDescription = setting.description || null;

            if (settingId === "customSearchUrlTemplate") {
              return (
                <CustomSearchEngineFields
                  key="custom-search-engine-fields"
                  template={getSetting<string>("customSearchUrlTemplate") ?? ""}
                  onTemplateChange={(value) => {
                    void setSetting("customSearchUrlTemplate", value);
                  }}
                  suggestionsProvider={
                    (getSetting<string>("customSearchSuggestionsProvider") as
                      | CustomSearchSuggestionsProviderId
                      | undefined) ?? "none"
                  }
                  onSuggestionsProviderChange={(value) => {
                    void setSetting("customSearchSuggestionsProvider", value);
                  }}
                />
              );
            }

            if (settingId === "customSearchSuggestionsProvider") {
              return null;
            }

            const isStringSetting = setting.type === "string";

            return (
              <div
                key={setting.id}
                className={cn(
                  "rounded-md p-3 transition-colors hover:bg-muted/50",
                  isStringSetting
                    ? "flex flex-col items-start gap-3"
                    : "flex flex-row items-center justify-between gap-4"
                )}
              >
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor={setting.id} className="text-sm font-medium">
                    {setting.name}
                  </Label>
                  {settingDescription && <p className="text-xs text-muted-foreground">{settingDescription}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <SettingsInput setting={setting} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}

export function BasicSettingsCards() {
  const { cards } = useSettings();

  return (
    <div className="space-y-6">
      {cards.map((card, index) => (
        <BasicSettingsCard key={index} card={card} />
      ))}
    </div>
  );
}
