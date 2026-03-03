# macOS Persistent Icon System

## Problem

Flow Browser has an icon customization system that lets users pick from 14 app icons. It was disabled on macOS because `app.dock.setIcon()` overrides the Liquid Glass icon from `Assets.car`, and the change doesn't persist across app restarts anyway.

## Goals

1. **Default icon = zero intervention.** When the icon is `"default"`, the main process does nothing -- no `app.dock.setIcon()`, no `NSWorkspace` calls. macOS renders the dynamic `Assets.car` Liquid Glass icon natively.
2. **Custom icons persist everywhere** -- Dock, Finder, Spotlight, Launchpad -- even when the app isn't running.
3. **Resetting to default restores Liquid Glass** with no stale cached icons.

## Prior Art

Granola documented this problem: https://www.granola.ai/blog/so-you-think-its-easy-to-change-an-app-icon

Their solution uses three native macOS techniques:

- `NSWorkspace.shared.setIcon(_:forFile:options:)` -- persists icon on the `.app` bundle (Finder/Spotlight/Launchpad)
- `NSDockTilePlugIn` -- a native plugin the Dock loads even when the app isn't running
- `SLSIconAppearanceConfiguration` private API -- forces the Dock to flush its icon cache on reset

## Architecture

```
                              +-----------------------------+
                              |     User selects icon        |
                              +--------------+--------------+
                                             |
                              +--------------v--------------+
                              |   Is it "default"?           |
                              +--+-----------------------+--+
                                 | YES                    | NO (custom)
                   +-------------v-----------+  +---------v----------------+
                   | 1. Clear Finder icon     |  | 1. app.dock.setIcon()    |
                   |    (NSWorkspace)          |  |    (running Dock)        |
                   | 2. Reset NSApp icon       |  | 2. NSWorkspace.setIcon   |
                   |    (setApplicationIcon    |  |    (Finder/Spotlight)    |
                   |     Image: nil)           |  | 3. Write icon path to   |
                   | 3. Invalidate Dock cache  |  |    shared file           |
                   |    (SLSIconAppearance     |  |    (for DockTilePlugin)  |
                   |     Configuration)        |  | 4. Notify plugin         |
                   | 4. Clear shared file      |  |                          |
                   | 5. Liquid Glass works!    |  |                          |
                   +---------------------------+  +--------------------------+
                                                            |
                              +-----------------------------+
                              |  On next launch (even if app isn't running):
                              |  NSDockTilePlugIn reads shared file,
                              |  sets Dock tile content view
                              +---------------------------------------------
```

## Implementation

### 1. Dependencies

- Add `objcjs-types` as a direct dependency (`bun add objcjs-types`).
- `objcjs-types` is bundled (not externalized) so Vite can tree-shake it. Add it to `externalizeDeps.exclude` in `electron.vite.config.ts`.
- `objc-js` (the native addon it wraps) stays external.

### 2. Re-enable macOS

Uncomment `"darwin"` in `supportedPlatforms` in `src/main/modules/icons.ts:15`.

### 3. Native macOS helper module

New file: `src/main/modules/macos-icon.ts`

Uses `objc-js` + `objcjs-types` for type-safe Objective-C bridging.

| Function                                        | API Used                                                                          | Purpose                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `setFinderIcon(pngPath, appBundlePath)`         | `NSWorkspace.sharedWorkspace().setIcon$forFile$options$(image, path, 0)`          | Set icon on `.app` bundle for Finder/Spotlight/Launchpad |
| `clearFinderIcon(appBundlePath)`                | `NSWorkspace.sharedWorkspace().setIcon$forFile$options$(null, path, 0)`           | Remove custom icon from `.app` bundle                    |
| `resetAppIconImage()`                           | `NSApplication.sharedApplication().setApplicationIconImage$(nil)`                 | Reset running Dock icon to bundle icon (Liquid Glass)    |
| `invalidateDockCache()`                         | `SLSIconAppearanceConfiguration.fetchCurrentIconAppearanceConfiguration().save()` | Force Dock to recompute all icons (private API)          |
| `getAppBundlePath()`                            | Resolve from `app.getAppPath()` up to `.app`                                      | Get the path to the running `.app` bundle                |
| `writeIconChoiceToSharedFile(iconPath or null)` | Write to `~/Library/Application Support/Flow/dock-tile-icon-path`                 | Shared file the DockTilePlugin reads                     |

### 4. Modified icon system logic (`src/main/modules/icons.ts`)

**`setAppIcon(iconId)` -- modified for macOS:**

- If `iconId === "default"`:
  - Call `resetAppIconImage()` (clears running Dock icon, restores Liquid Glass)
  - Call `clearFinderIcon(appBundlePath)` (clears Finder icon)
  - Call `invalidateDockCache()` (forces Dock to re-render from bundle)
  - Call `writeIconChoiceToSharedFile(null)` (tells plugin to use default)
  - Do NOT call `app.dock.setIcon()`
  - Return early
- If custom `iconId`:
  - Transform icon with `sharp` (existing)
  - Call `app.dock.setIcon(nativeImage)` (existing)
  - Save transformed icon PNG to a persistent path (`<appData>/icons/<iconId>.png`)
  - Call `setFinderIcon(savedPngPath, appBundlePath)` (NEW)
  - Call `writeIconChoiceToSharedFile(savedPngPath)` (NEW)

**`updateAppIcon()` -- modified:**

- If `currentIconId === "default"` on macOS: return (no-op, let Liquid Glass work)

**Startup (`app.whenReady()`) -- modified:**

- If saved icon is `"default"`: skip `setAppIcon("default")` entirely on macOS
- If saved icon is custom: run existing logic

### 5. NSDockTilePlugIn

A native macOS plugin bundle that the Dock loads even when the app isn't running.

**Source:** `build/dock-tile-plugin/FlowDockTilePlugin.m` (Objective-C)

The plugin:

1. Implements `NSDockTilePlugIn` protocol
2. In `setDockTile:`, reads the shared file at `~/Library/Application Support/Flow/dock-tile-icon-path`
3. If file is empty/missing: `setContentView:nil` (Liquid Glass renders)
4. If file contains an icon path: load `NSImage`, create `NSImageView`, set as `contentView`, call `display`

**Bundle structure:**

```
FlowDockTilePlugin.plugin/
  Contents/
    Info.plist          (NSPrincipalClass = FlowDockTilePlugin)
    MacOS/
      FlowDockTilePlugin  (compiled binary)
```

**Build integration:**

- Compiled in `afterPack.js` hook using `clang` (available on all Macs with Xcode CLI tools)
- Placed in `<App>.app/Contents/PlugIns/`
- `NSDockTilePlugIn = "FlowDockTilePlugin"` added to Info.plist via electron-builder `extendInfo`

### 6. electron-builder config (`electron-builder.ts`)

- Add `NSDockTilePlugIn: "FlowDockTilePlugin"` to `mac.extendInfo`
- Ensure `objc-js` native prebuilds are handled (may need `asarUnpack` entry)

### 7. Shared state: plugin communication

The app writes the custom icon's absolute file path to `~/Library/Application Support/Flow/dock-tile-icon-path`. The DockTilePlugin reads this file. This is simpler than NSUserDefaults because the plugin runs in the Dock's process.

- File present with a path -> custom icon
- File absent or empty -> default (Liquid Glass)

### 8. Dock cache invalidation

Uses the `SLSIconAppearanceConfiguration` private API via `objc-js` runtime:

```typescript
// Access via NSClassFromString since it's private
const cls = runtime.NSClassFromString("SLSIconAppearanceConfiguration");
const config = cls.fetchCurrentIconAppearanceConfiguration();
config.save();
```

This tells macOS "something about icon appearance changed, recompute everything." The Dock throws away its cache and picks up the real icon. No visual disruption (unlike `killall Dock`).

## Files

| File                                          | Action                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------- |
| `src/main/modules/icons.ts`                   | Modify -- re-enable macOS, change set/reset logic                          |
| `src/main/modules/macos-icon.ts`              | **Create** -- native macOS API calls via objc-js                           |
| `build/dock-tile-plugin/FlowDockTilePlugin.m` | **Create** -- NSDockTilePlugIn source                                      |
| `build/dock-tile-plugin/Info.plist`           | **Create** -- plugin bundle Info.plist                                     |
| `build/hooks/afterPack.js`                    | Modify -- add plugin compilation step                                      |
| `build/hooks/components/dock-tile-plugin.js`  | **Create** -- compilation logic                                            |
| `electron-builder.ts`                         | Modify -- add NSDockTilePlugIn to extendInfo                               |
| `electron.vite.config.ts`                     | Modify -- add `objcjs-types` to `externalizeDeps.exclude` for tree-shaking |
| `package.json`                                | Modify -- add `objcjs-types` dependency                                    |
