# Permission Warnings

The permission warnings module provides utilities for generating user-facing warning messages based on Chrome extension manifest permissions. It implements Chromium's permission warning logic to help users understand the security implications of different extensions.

## Overview

When a user installs or updates an extension, they are shown warning messages about the capabilities the extension is requesting. This module converts the permissions listed in the manifest.json file into human-readable warning messages.

## API

### `getPermissionWarnings(manifestPermissions, hostPermissions)`

Processes a list of manifest permissions and generates user-facing warning messages that follow the precedence rules defined in Chromium.

#### Arguments

- `manifestPermissions` String[] - An array of permission strings from the extension's manifest.json (e.g., `["tabs", "storage", "history"]`)
- `hostPermissions` String[] (optional) - An array of host permission strings (e.g., `["<all_urls>", "https://*.google.com/*"]`)

#### Returns

- `String[]` - An array of user-facing warning messages corresponding to the provided permissions.

## Example Usage

```typescript
import { getPermissionWarnings } from "electron/modules/extensions/permission-warnings";

// Get warnings for an extension with several permissions
const manifestPermissions = ["tabs", "history", "storage", "clipboardRead"];
const hostPermissions = ["<all_urls>"];

const warnings = getPermissionWarnings(manifestPermissions, hostPermissions);
// Returns an array like:
// [
//   "Read and change all your data on all websites",
//   "Read and change your Browse history on all your signed-in devices"
// ]

// Example with specific host permissions
const manifestPerms = ["tabs", "activeTab", "scripting"];
const hostPerms = ["https://www.google.com/*", "https://developer.chrome.com/*"];

const specificWarnings = getPermissionWarnings(manifestPerms, hostPerms);
// Returns an array like:
// [
//   "Read your Browse history",
//   "Access your data on specific sites"
// ]
```

## Warning Message Generation Logic

The module follows these general rules when generating warnings:

1. Higher-impact permissions like `<all_urls>` or `debugger` take precedence
2. Specific combinations of permissions may generate specialized warnings
3. When host permissions are provided, warnings are prioritized based on their scope (all sites vs. specific sites)
4. Similar or related permissions may be grouped into a single warning message

## Implementation Details

This module is derived from Chromium's permission message rules and strings. It's implemented as a translation of the logic found in:

- Rules logic: `chrome/common/extensions/permissions/chrome_permission_message_rules.cc`
- Message strings: `chrome/app/generated_resources.grd`

### Limitations

- Does not replicate dynamic formatting (HostListFormatter, etc.). Uses static messages.
- Assumes a default environment (e.g., not ChromeOS-specific) for conditional messages.
- Permission mapping from C++ API Permission IDs to manifest strings is best-effort.
- Does not replace placeholders in messages.
