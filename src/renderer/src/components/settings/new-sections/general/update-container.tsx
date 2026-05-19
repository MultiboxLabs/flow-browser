import { Container, ContainerItem } from "@/components/settings/components/basic/container";
import { ButtonAction } from "@/components/settings/components/basic/actions/button";
import { useAppUpdates } from "@/components/providers/app-updates-provider";
import { ContainerBasicSettingItem } from "@/components/settings/components/basic/settings";
import { ExtraInfoAction } from "@/components/settings/components/basic/actions/extra-info";
import { cn } from "@/lib/utils";

type UpdateItemActionState = "downloaded" | "downloading" | "hasAvailable" | null;

function UpdateItemAction({ state }: { state: UpdateItemActionState }) {
  const {
    isCheckingForUpdates,
    isInstallingUpdate,
    updateStatus,
    isAutoUpdateSupported,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  } = useAppUpdates();
  const isUpdateDataLoading = updateStatus === null;

  const btnLoading = isCheckingForUpdates || isInstallingUpdate;

  let btnText = "Check now";
  if (state === "downloaded") {
    btnText = `Install Update`;
  } else if (state === "downloading" && updateStatus?.downloadProgress) {
    btnText = `Downloading (${Math.floor(updateStatus.downloadProgress.percent)}%)`;
  } else if (state === "hasAvailable" && updateStatus?.availableUpdate) {
    btnText = `Download v${updateStatus.availableUpdate.version}`;
  }

  const buttonDisabled = state === "downloading" || btnLoading;

  const clickAction = () => {
    if (state === "downloaded" && updateStatus?.updateDownloaded) {
      installUpdate();
    } else if (state === "hasAvailable" && updateStatus?.availableUpdate) {
      downloadUpdate();
    } else {
      checkForUpdates();
    }
  };

  if (!isUpdateDataLoading && !isAutoUpdateSupported) {
    return <ExtraInfoAction text="Not supported" />;
  }

  return (
    <ButtonAction
      className={cn("w-38 px-2", state === "downloading" && "tabular-nums")}
      text={!btnLoading ? btnText : ""}
      loader={btnLoading}
      onClick={clickAction}
      blur={isUpdateDataLoading}
      disabled={buttonDisabled}
    />
  );
}

function UpdateItem() {
  const { updateStatus } = useAppUpdates();

  let currentState: UpdateItemActionState = null;
  if (updateStatus?.updateDownloaded) {
    currentState = "downloaded";
  } else if (updateStatus?.downloadProgress) {
    currentState = "downloading";
  } else if (updateStatus?.availableUpdate) {
    currentState = "hasAvailable";
  }

  return <ContainerItem title="Flow Updates" action={<UpdateItemAction state={currentState} />} />;
}

export function UpdateContainer() {
  return (
    <Container withSeparators>
      <ContainerBasicSettingItem settingId="autoUpdate" />
      <UpdateItem />
    </Container>
  );
}
