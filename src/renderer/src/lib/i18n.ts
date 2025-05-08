import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";

// Tell vite to load all locale files
import.meta.glob("@/locales/*/*.json");

// Initialize i18n as quickly as possible
i18n
  .use(resourcesToBackend((language: string, namespace: string) => import(`@/locales/${language}/${namespace}.json`)))
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    lng: "en", // default language
    fallbackLng: "en",

    ns: ["browser-ui"],

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

// Set the language to the user's locale
flow.app.getAppInfo().then((appInfo) => {
  i18n.changeLanguage(appInfo.locale);
});

export default i18n;
