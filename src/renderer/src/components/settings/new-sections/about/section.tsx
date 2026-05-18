import { SectionHeader, SubsectionHeader } from "@/components/settings/components/basic/headers";
import { ImageComp } from "@/components/settings/components/basic/image";
import { useAppInfo } from "./use-app-info";
import { Container, ContainerItem } from "../../components/basic/container";
import { ExtraInfoAction } from "@/components/settings/components/basic/actions/extra-info";
import { LinkAction } from "@/components/settings/components/basic/actions/link";
import { LinkWrapper } from "@/components/settings/components/basic/link-wrapper";

export function AboutSection() {
  const { appInfo } = useAppInfo();

  return (
    <>
      <SectionHeader
        title="Flow"
        description={appInfo?.app_version ? `Version ${appInfo.app_version}` : "Loading..."}
        icon={<ImageComp src={`flow://asset/liquid-glass-icon.png`} className="size-full" />}
        iconClassName="size-18"
      />
      <Container withSeparators>
        <ContainerItem
          title="App Version"
          action={
            <ExtraInfoAction
              text={appInfo?.app_version ? `v${appInfo.app_version}` : "Loading..."}
              textColor="normal"
            />
          }
        />
        <ContainerItem
          title="Update Channel"
          action={<ExtraInfoAction text={appInfo?.update_channel ? `${appInfo.update_channel}` : "Loading..."} />}
        />
        <ContainerItem
          title="Engine Version"
          action={
            <ExtraInfoAction text={appInfo?.chrome_version ? `Chromium ${appInfo.chrome_version}` : "Loading..."} />
          }
        />
        <ContainerItem
          title="Node Version"
          action={<ExtraInfoAction text={appInfo?.node_version ? `Node ${appInfo.node_version}` : "Loading..."} />}
        />
        <ContainerItem
          title="Electron Version"
          action={
            <ExtraInfoAction text={appInfo?.electron_version ? `Electron ${appInfo.electron_version}` : "Loading..."} />
          }
        />
        <ContainerItem
          title="Operating System"
          action={<ExtraInfoAction text={appInfo?.os ? `${appInfo.os}` : "Loading..."} />}
        />
      </Container>
      <SubsectionHeader title="Links" />
      <Container withSeparators>
        <LinkWrapper href="https://flow-browser.com" className="w-full">
          <ContainerItem title="Website" action={<LinkAction />} clickEffect />
        </LinkWrapper>
        <LinkWrapper href="https://discord.gg/8gjEa4Rt2b" className="w-full">
          <ContainerItem title="Discord Community" action={<LinkAction />} clickEffect />
        </LinkWrapper>
      </Container>
    </>
  );
}
