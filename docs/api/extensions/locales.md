# Extension Locales

The Extension Locales module provides utilities for handling internationalization and localization in browser extensions. It enables the retrieval and application of localized messages from extension `_locales` directories.

## Overview

Chrome extensions support internationalization through locale-specific message files. This module helps in retrieving those messages and translating strings based on the user's locale or the extension's default locale.

## API

### `transformStringToLocale(extensionPath, str, targetLocale)`

Transforms a message key into its localized version using the extension's locale files. The function attempts to use the user's current locale first, then falls back to the extension's default locale if needed.

#### Arguments

- `extensionPath` String - The file system path to the extension's root directory
- `str` String - The message key to transform (e.g., `"@@extension_name"`)
- `targetLocale` String (optional) - Specific locale to use for translation (currently unused in implementation)

#### Returns

- `Promise<String>` - A promise that resolves to the localized message, or the original string if no translation is found

## Example Usage

```typescript
import { transformStringToLocale } from "electron/modules/extensions/locales";

// Transform a string using the extension's localization
const extensionPath = "/path/to/extension";
const messageKey = "extension_name";

async function getLocalizedName() {
  const localizedName = await transformStringToLocale(extensionPath, messageKey);
  console.log(`Extension name: ${localizedName}`);
}

// The function will:
// 1. Check if the extension has locale files
// 2. Try to use the user's current locale
// 3. Fall back to the extension's default locale if needed
// 4. Return the original string if no localization is found
```

## Internal Functions

The module also includes several internal functions that handle the localization process:

### Locale File Path Resolution

- `getLocalesRootPath(extensionPath)`: Returns the path to the extension's \_locales directory
- `getLocalePath(extensionPath, locale)`: Returns the path to a specific locale's messages.json file

### Locale Data Retrieval

- `hasLocales(extensionPath)`: Checks if an extension has any locale files
- `getAllLocales(extensionPath)`: Gets a list of all available locales for an extension
- `getLocaleData(extensionPath, locale)`: Retrieves the locale data for a specific locale
- `translateString(extensionPath, locale, str)`: Translates a string using a specific locale's data

## Implementation Details

The module works by:

1. Checking if the extension has any locale files
2. Attempting to use the user's current locale (as determined by `app.getLocale()`)
3. Falling back to the extension's default locale (specified in manifest.json)
4. Reading and parsing the appropriate messages.json file
5. Looking up the requested message key and returning its localized value

The locale data follows the Chrome extension internationalization format, where each key in the messages.json file maps to an object with a "message" property containing the translated text.

## Error Handling

- If a locale file doesn't exist or can't be parsed, the function will return the original string
- If a message key doesn't exist in the locale data, the original string is returned
- Console errors are logged when there are issues parsing locale data
