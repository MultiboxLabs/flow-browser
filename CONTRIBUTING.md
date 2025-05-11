# Contributing to Flow Browser

## Project Structure

| Directory        | Description                                  |
| ---------------- | -------------------------------------------- |
| **src/main**     | Electron main process code                   |
| **src/renderer** | Frontend React application                   |
| **src/preload**  | Preload scripts for secure IPC communication |
| **src/shared**   | Code shared between main and renderer        |
| **docs**         | Documentation and guides                     |

## Prerequisites

- [Node.js](https://nodejs.org/en/download) (v22+)
- [Bun](https://bun.sh/docs/installation) (v1.2.0+)

> [!IMPORTANT]
>
> Electron uses node-gyp to build native modules.
>
> You need to [install some dependencies](https://github.com/nodejs/node-gyp?tab=readme-ov-file#installation) for node-gyp to work, or it might fail to build.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/MultiboxLabs/flow-browser.git
cd flow-browser

# Install dependencies
bun install

# Start the application in Preview Mode
bun start

# Development with hot reloading
bun dev

# Development with file watching (Recommended)
bun dev:watch
```

For more detailed development info, see the [contributing documentation](./docs/contributing/).

## Using Extensions

### From Chrome Web Store

1. Navigate to the [Chrome Web Store](https://chromewebstore.google.com/)
2. Browse and install extensions directly from the store

## Building

There are different commands to build the application for different platforms.

```bash
bun build:win    # Windows
bun build:mac    # macOS
bun build:linux  # Linux
```

The build output will be in the `./dist` directory.

## Technology Stack

- **Frontend**: React 19, TailwindCSS
- **Animation**: Motion (imported from "motion/react")
- **UI Components**: Radix UI
- **Build Tools**: Electron Builder, electron-vite, Vite, TypeScript
- **Runtime**: Electron 35 (Chromium)

## Widewine VMP Signing (Advanced)

This build pipeline contains Widewine Signing Capabilities. However, you will have to create an account in order to enable it.

Create an Account: https://github.com/castlabs/electron-releases/wiki/EVS#creating-an-evs-account

Once logged in, the app will be automatically VMP-signed, and you can enjoy Widewine Protected Content!
