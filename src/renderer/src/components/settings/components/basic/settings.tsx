import { useSettings } from "@/components/providers/settings-provider";
import { ContainerItem } from "./container";
import { Switch } from "./actions/switch";
import { Select } from "@/components/settings/components/basic/actions/select";

export function ContainerBasicSettingItem({ settingId }: { settingId: string }) {
  const { settings, getSetting, setSetting } = useSettings();
  const setting = settings.find((s) => s.id === settingId);
  if (!setting) return null;

  if (setting.type === "boolean") {
    const settingValue = getSetting<boolean>(setting.id);
    return (
      <ContainerItem
        title={setting.name}
        description={setting.description}
        action={<Switch active={settingValue} onToggle={() => setSetting(setting.id, !settingValue)} />}
      />
    );
  }

  if (setting.type === "enum") {
    const settingValue = getSetting<string>(setting.id);
    return (
      <ContainerItem
        title={setting.name}
        description={setting.description}
        action={
          <Select
            value={settingValue}
            onValueChange={(value) => setSetting(setting.id, value)}
            items={setting.options}
          />
        }
      />
    );
  }

  return null;
  // return <ContainerItem title={setting.name} description={setting.description} />;
}
