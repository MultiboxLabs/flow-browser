import { AppUpdatesProvider } from "@/components/providers/app-updates-provider";
import { UpdateContainer } from "./update-container";
import { Container } from "@/components/settings/components/basic/container";
import { ContainerBasicSettingItem } from "@/components/settings/components/basic/settings";

export function GeneralSection() {
  return (
    <AppUpdatesProvider>
      <UpdateContainer />
      <Container>
        <ContainerBasicSettingItem settingId="contentBlocker" />
      </Container>
    </AppUpdatesProvider>
  );
}
