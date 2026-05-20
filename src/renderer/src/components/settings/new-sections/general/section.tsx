import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";
import { UpdateContainer } from "./update-container";
import { Container } from "@/components/settings/components/basic/container";
import { ContainerBasicSettingItem } from "@/components/settings/components/basic/settings";
import { SubsectionHeader } from "@/components/settings/components/basic/headers";
import { SetDefaultBrowserSetting } from "./default-browser-setting";

export function GeneralSection() {
  return (
    <AppUpdatesProvider>
      <UpdateContainer />
      <SubsectionHeader title="General" />
      <Container withSeparators>
        <SetDefaultBrowserSetting />
        <ContainerBasicSettingItem settingId="syncTabsAcrossWindows" />
        <ContainerBasicSettingItem settingId="contentBlocker" />
      </Container>
    </AppUpdatesProvider>
  );
}
