import i18n from "i18next";
import { initReactI18next, useTranslation } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";

// Config
const I18N_DEBUG_ENABLED = false;

// Tell vite to load all locale files
import.meta.glob("~/locales/*/*.json");

// Initialize i18n as quickly as possible
i18n
  .use(resourcesToBackend((language: string, namespace: string) => import(`~/locales/${language}/${namespace}.json`)))
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    lng: "en", // default language
    fallbackLng: "en",

    ns: ["browser-ui", "settings", "icons"],

    keySeparator: false, // turn off nested key splitting
    nsSeparator: false, // turn off namespace splitting

    interpolation: {
      escapeValue: false // react already safes from xss
    },
    postProcess: I18N_DEBUG_ENABLED ? ["debugger"] : [],
    debug: I18N_DEBUG_ENABLED
  });

// Custom post processor for debugging
const debugProcessor = {
  type: "postProcessor" as const, // Add type assertion
  name: "debugger",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  process(value: string, _key: string, _options: unknown, _translator: unknown) {
    if (I18N_DEBUG_ENABLED) {
      return "a";
    }
    return value;
  }
};

i18n.use(debugProcessor); // Register the post processor

// Set the language to the user's locale
flow.app.getAppInfo().then((appInfo) => {
  i18n.changeLanguage(appInfo.locale);
});

export function useBrowserUITranslations() {
  return useTranslation("browser-ui");
}

export function useSettingsTranslations() {
  return useTranslation("settings");
}

export function useIconsTranslations() {
  return useTranslation("icons");
}

export function usePagesTranslations() {
  return useTranslation("pages");
}

export default i18n;
