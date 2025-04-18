import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { BasicSetting, BasicSettingCard } from "~/types/settings";

interface SettingsContextValue {
  settings: BasicSetting[];
  cards: BasicSettingCard[];
  getSetting: <T>(settingId: string) => T;
  setSetting: (settingId: string, value: unknown) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettings] = useState<BasicSetting[]>([]);
  const [cards, setCards] = useState<BasicSettingCard[]>([]);
  const [settingsValues, setSettingsValues] = useState<Record<string, unknown>>({});

  const fetchSettings = useCallback(async () => {
    if (!flow) return;

    const { settings: fetchedSettings, cards: fetchedCards } = await flow.settings.getBasicSettings();
    setSettings(fetchedSettings);
    setCards(fetchedCards);

    const promises = fetchedSettings.map(async (setting) => {
      const value = await flow.settings.getSetting(setting.id);
      setSettingsValues((prev) => ({ ...prev, [setting.id]: value }));
    });

    await Promise.all(promises);
  }, []);

  const revalidate = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const unsub = flow.settings.onSettingsChanged(() => {
      revalidate();
    });
    return () => unsub();
  }, [revalidate]);

  const getSetting = useCallback(
    (settingId: string) => {
      return settingsValues[settingId];
    },
    [settingsValues]
  );

  const setSetting = useCallback((settingId: string, value: unknown) => {
    return flow.settings.setSetting(settingId, value);
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        cards,
        getSetting: getSetting as <T>(settingId: string) => T,
        setSetting
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
