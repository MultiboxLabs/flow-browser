import { getManifest } from "@/modules/extensions/management";
import path from "path";
import fs from "fs/promises";
import { getFsStat } from "@/modules/utils";
import { app } from "electron";

type LocaleData = {
  [key: string]: {
    message: string;
  };
};

// Get Locale Paths //
function getLocalesRootPath(extensionPath: string) {
  return path.join(extensionPath, "_locales");
}
function getLocalePath(extensionPath: string, locale: string) {
  return path.join(getLocalesRootPath(extensionPath), locale, "messages.json");
}

// Get Locale Data //
async function hasLocales(extensionPath: string) {
  try {
    const localesRootPath = getLocalesRootPath(extensionPath);
    const stats = await getFsStat(localesRootPath);
    return stats?.isDirectory() || false;
  } catch (error) {
    console.error(`Error checking locales directory for ${extensionPath}:`, error);
    return false;
  }
}

async function getLocaleData(extensionPath: string, locale: string): Promise<LocaleData | null> {
  try {
    const localePath = getLocalePath(extensionPath, locale);
    const stats = await getFsStat(localePath);
    if (!stats?.isFile()) return null;

    const data = await fs.readFile(localePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error getting locale data for ${locale} in ${extensionPath}:`, error);
    return null;
  }
}

async function getAllLocales(extensionPath: string): Promise<string[]> {
  try {
    const localesExists = await hasLocales(extensionPath);
    if (!localesExists) return [];

    const localesRootPath = getLocalesRootPath(extensionPath);
    const locales = await fs.readdir(localesRootPath);
    return locales;
  } catch (error) {
    console.error(`Error getting all locales for ${extensionPath}:`, error);
    return [];
  }
}

async function translateString(extensionPath: string, locale: string, str: string): Promise<string> {
  try {
    const localeData = await getLocaleData(extensionPath, locale);
    if (!localeData) return str;

    const translation = localeData[str];
    if (!translation) return str;

    return translation.message;
  } catch (error) {
    console.error(`Error translating string "${str}" for locale ${locale}:`, error);
    return str;
  }
}

export async function transformStringToLocale(
  extensionPath: string,
  str: string,
  targetLocale?: string
): Promise<string> {
  try {
    const locales = await getAllLocales(extensionPath);
    if (locales.length === 0) return str;

    // Try to translate to target locale
    if (targetLocale) {
      const hasTargetLocale = locales.includes(targetLocale);
      if (hasTargetLocale) {
        return await translateString(extensionPath, targetLocale, str);
      }
    }

    // Try to translate to user locale
    const userLocale = app.getLocale();
    const hasUserLocale = locales.includes(userLocale);
    if (hasUserLocale) {
      return await translateString(extensionPath, userLocale, str);
    }

    // Try to translate to default locale
    const manifest = await getManifest(extensionPath);
    const defaultLocale = manifest?.default_locale;
    if (!defaultLocale) return str;

    const hasDefaultLocale = locales.includes(defaultLocale);
    if (!hasDefaultLocale) return str;

    return await translateString(extensionPath, defaultLocale, str);
  } catch (error) {
    console.error(`Error transforming string "${str}" to locale:`, error);
    return str;
  }
}
