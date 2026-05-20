import { ButtonAction } from "@/components/settings/components/basic/actions/button";
import { ContainerItem } from "@/components/settings/components/basic/container";
import { useEffect, useState } from "react";

function useDefaultBrowser() {
  const [isDefault, setIsDefault] = useState<boolean | null>(null);

  useEffect(() => {
    const refetchDefaultBrowser = async () => {
      const isDefaultResult = await flow.app.getDefaultBrowser();
      setIsDefault(isDefaultResult);
    };

    refetchDefaultBrowser();
    const interval = setInterval(refetchDefaultBrowser, 2000);
    return () => clearInterval(interval);
  }, []);

  const setDefaultBrowser = () => {
    flow.app.setDefaultBrowser();
  };

  return { isDefault, setDefaultBrowser };
}

export function SetDefaultBrowserSetting() {
  const { isDefault, setDefaultBrowser } = useDefaultBrowser();

  return (
    <ContainerItem
      title="Default Browser"
      description="Make Flow your default browser"
      action={
        <ButtonAction
          text={isDefault ? "Flow is Default" : "Make Default"}
          onClick={setDefaultBrowser}
          disabled={isDefault ?? true}
          blur={isDefault === null}
        />
      }
    />
  );
}
