import { useSettings } from "@/components/providers/settings-provider";
import { BasicSetting, BasicSettingCard } from "~/types/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

function SettingsInput({ setting }: { setting: BasicSetting }) {
  const { getSetting, setSetting } = useSettings();

  const handleSettingChange = (value: BasicSetting["defaultValue"]) => {
    setSetting(setting.id, value);
  };

  if (setting.type === "enum") {
    const settingValue = getSetting<string>(setting.id);
    return (
      <div className={cn(setting.showName ? "w-1/2" : "w-full")}>
        <Select value={settingValue} onValueChange={handleSettingChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="remove-app-drag z-50">
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
  }

  return null;
}

export function BasicSettingsCard({ card, transparent }: { card: BasicSettingCard; transparent?: boolean }) {
  const { settings } = useSettings();

  return (
    <Card className={cn("remove-app-drag", transparent && "bg-white/10 backdrop-blur-md border border-white/20")}>
      <CardHeader>
        <CardTitle>{card.title}</CardTitle>
        <CardDescription>{card.subtitle}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {card.settings.map((settingId) => {
          const setting = settings.find((setting) => setting.id === settingId);
          if (!setting) return null;

          return (
            <div key={setting.id} className="flex flex-row items-center justify-between gap-2">
              {setting.showName !== false && <Label>{setting.name}</Label>}
              <SettingsInput setting={setting} />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function BasicSettingsCards() {
  const { cards } = useSettings();

  return (
    <>
      {cards.map((card, index) => (
        <BasicSettingsCard key={index} card={card} />
      ))}
    </>
  );
}
