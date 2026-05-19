import { useSettings } from "@/components/providers/settings-provider";
import { ContainerItem } from "./container";
import { Switch } from "../../components/basic/switch";

export function ContainerBasicSettingItem({ settingId }: { settingId: string }) {
  const { settings, getSetting, setSetting } = useSettings();
  const setting = settings.find((s) => s.id === settingId);
  if (!setting) return null;

  if (setting.type === "boolean") {
    const settingValue = getSetting<boolean>(setting.id);
    return (
      <ContainerItem
        title={setting.name}
        action={<Switch active={settingValue} onToggle={() => setSetting(setting.id, !settingValue)} />}
      />
    );
  }
  return <ContainerItem title={setting.name} />;
}
