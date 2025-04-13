# Contributing to Flow Browser

## Monorepo Parts

| Name         | Description                   |
| ------------ | ----------------------------- |
| **electron** | The main electron application |
| **vite**     | Frontend for the browser      |

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

# Install dependencies and launch the browser
bun install
bun start
```

For development with hot reloading, see the [Hot Reloading Guide](./docs/contributing/hot-reloading.md).

## Using Extensions

### From Chrome Web Store

1. Navigate to the [Chrome Web Store](https://chromewebstore.google.com/)
2. Browse and install extensions directly from the store

### Local Extensions

Refer to the [Local Extensions](./extensions/README.md) documentation for more information.

## Building

You can use `bun build` to build the application.

The result will be in the `./electron/out` folder.

## Technology Stack

- **Frontend**: React 19, Tailwind CSS, Motion
- **Routing**: TanStack Router
- **Build Tools**: Vite, TypeScript, Bun
- **Runtime**: Electron 35 (Chromium)
