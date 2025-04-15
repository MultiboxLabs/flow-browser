# Flow Browser

A modern, tabbed web browser with Chrome extension support—built on Electron.

<p align="center">
  <img src="./electron/assets/AppIcon.png" width="128" height="128" alt="Flow Browser Logo" />
</p>

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/MultiboxLabs/flow-browser?utm_source=oss&utm_medium=github&utm_campaign=MultiboxLabs%2Fflow-browser&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Overview

Flow Browser is a lightweight, feature-rich web browser that combines the power of Chromium with a clean, modern interface. Built on Electron, it offers full support for Chrome extensions, making it a versatile alternative to mainstream browsers.

## Install (v0.3.2)

> [!WARNING]
>
> macOS's version is not currently code-signed!
>
> If you just download it from your browser, it will be blocked by [Gatekeeper](https://disable-gatekeeper.github.io/), which says 'This application is damaged' and will not let you open it.

### macOS:

```bash
# Run this command in your terminal
curl -LO https://github.com/MultiboxLabs/flow-browser/releases/download/v0.3.2/FlowInstaller.dmg
```

### Windows:

Download [FlowSetup.exe](https://github.com/MultiboxLabs/flow-browser/releases/download/v0.3.2/FlowSetup.exe)

### Linux:

Choose the file you need and [download from GitHub Releases](https://github.com/MultiboxLabs/flow-browser/releases).

## Screenshots

![Onboarding - macOS](./assets/screenshots/beta-onboarding-1.png)
![Browser - macOS](./assets/screenshots/beta-browser-1.png)
![Command - macOS](./assets/screenshots/beta-command-1.png)
![Settings - macOS](./assets/screenshots/beta-settings-1.png)

## Features

- **Profiles**: Multiple profiles support, allowing you to use different settings and extensions for each profile.
- **Spaces**: Multiple spaces support, allowing you to organize your tabs into different spaces.
- **Sidebar**: A sidebar that allows you to quickly access your bookmarks, history, and settings.
- **Command Palette**: A command palette that allows you to search the web or quickly open a new tab, bookmark, or history.
- **Good Security**: Asks before opening external applications.
- **Simple Onboarding**: A simple onboarding process that allows you to quickly get started.
- **Wide Customization**: Custom icons, new page mode, and more.
- **Offline Games**: A collection of offline games to play when you have nothing to do. (flow://games)

## Upcoming Features

- **Native Adblocker**: A native adblocker that blocks ads and trackers.
- **Topbar**: Allow you to customise between a topbar or sidebar.
- **Downloads**: Allow you to download files from the web.
- **Extensions**: Allow you to install chrome extensions from the Chrome Web Store.
- **Favourites**: Allow you to add websites to your favourites.
- **Pinned Tabs**: Allow you to pin tabs in spaces.
- **Persist Tabs**: Allow you to persist tabs between restarts.
- **Sleep Tabs**: Allow you to put tabs to sleep to save resources.
- **Custom Search Engines**: Allow you to add custom search engines.
- **Preview Tabs**: Allow you to preview tabs before switching to them.
- **Widewine Support**: Allow you to watch DRM protected content.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for more information.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE](./LICENSE) file for details.

## Acknowledgements

Some parts of Flow Browser are based on [electron-browser-shell](https://github.com/samuelmaddock/electron-browser-shell) by [Sam Maddock](https://github.com/samuelmaddock), with enhancements and modifications.

Design inspired by [Arc Browser](https://arc.net) and [Zen Browser](https://zen-browser.app/), which has a minimalistic design that is clean and simple.
