# Flow Browser

A modern, tabbed web browser with Chrome extension support—built on Electron.

<p align="center">
  <img src="./electron/assets/AppIcon.png" width="128" height="128" alt="Flow Browser Logo" />
</p>

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/MultiboxLabs/flow-browser?utm_source=oss&utm_medium=github&utm_campaign=MultiboxLabs%2Fflow-browser&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Overview

Flow Browser is a lightweight, feature-rich web browser that combines the power of Chromium with a clean, modern interface. Built on Electron, it offers full support for Chrome extensions, making it a versatile alternative to mainstream browsers.

## Screenshots

![Flow Browser Screenshot](./assets/screenshots/beta-1.png)
![Flow Browser Screenshot](./assets/screenshots/beta-2.png)

## Features

- **Modern UI**: Clean, intuitive interface built with React 19 and Tailwind CSS
- **Tab Management**: Efficient browsing with multi-tab support
- **Chrome Extension Support**: Install and use extensions from the Chrome Web Store
- **Extension API Support**: Compatible with most Chrome extension APIs
- **Manifest V3 Support**: Ready for the latest extension standards

## Monorepo Parts

| Name         | Description                                        |
| ------------ | -------------------------------------------------- |
| **electron** | The main browser application with tabbed interface |
| **vite**     | Frontend for the browser                           |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/MultiboxLabs/flow-browser.git
cd flow-browser

# Install dependencies and launch the browser
bun install
bun start
```

## Using Extensions

### From Chrome Web Store

1. Navigate to the [Chrome Web Store](https://chromewebstore.google.com/)
2. Browse and install extensions directly from the store

### Local Extensions

Refer to the [Local Extensions](./extensions/README.md) documentation for more information.

## Development

```bash
# Build all packages
bun build

# Start
bun start
```

## Technology Stack

- **Frontend**: React 19, Tailwind CSS, Framer Motion
- **Routing**: TanStack Router
- **Build Tools**: Vite, TypeScript, Bun
- **Runtime**: Electron 35 (Chromium)

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0) - see the [LICENSE](./LICENSE) file for details.

## Acknowledgements

Some parts of Flow Browser are based on [electron-browser-shell](https://github.com/samuelmaddock/electron-browser-shell) by [Sam Maddock](https://github.com/samuelmaddock), with enhancements and modifications.

Design inspired by [Arc Browser](https://arc.net) and [Zen Browser](https://zen-browser.app/), which has a minimalistic design that is clean and simple.
