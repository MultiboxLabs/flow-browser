# Dependencies

This is a list of dependencies we use and reasons why they are used.

> The dependencies list below should be A-Z sorted.

## Dependencies

These dependencies are bundled into the `node_modules` of the app. These should be used by the main process, or it could go in the Dev Dependencies.

### Local Database Dependencies

- better-sqlite3 - SQLite Connector for the app.
- drizzle-orm - ORM for the app.
- knex - SQL Query Builder for the app.

### Uncategorized Dependencies

- @ghostery/adblocker-electron - Built-in adblocker for Flow.
- @phosphor-icons/core - Material Icons for the app.
- electron-chrome-extensions - Patches the chrome extensions API to ensure they work.
- electron-chrome-web-store - Patches APIs the Chrome Web Store needs to work & make it think this is Chrome.
- electron-context-menu - Context menu for the app.
- electron-updater - Handles updating the app.
- electron-webauthn - Handles WebAuthn (Passkeys) for websites on macOS.
- icojs - ICO Parser for favicons.
- mime-types - Provide mime types.
- posthog-node - Provide analytics.
- arktype - Handles Data Validation. (Better alternative to zod)
- sharp - Image Processing.
- tldts - Parse top-level domains from URLs.

## Dev Dependencies

These dependencies are either used in the build process, or they are only used in the renderer process.

### Core Dependencies (Builds and Powers the App)

- electron - Powers the app
- electron-builder - Help packages, build and distributes the app
- electron-vite - Helps structure the app and get vite to bundle the app.
- vite - Bundles the app.
- typescript - Handles TypeScript.
- prettier - Formats the code.

### Other Build Dependencies

- @vitejs/plugin-react - Plugin for vite to bundle the react frontend.
- babel-plugin-react-compiler - Babel plugin to enable the React Compiler for optimized re-renders.
- cross-env - Set environment variables cross-platform in npm scripts.
- drizzle-kit - CLI tooling for Drizzle ORM migrations and schema management.
- jju - Handles updating JSON while maintaining the current formatting. This is used for several build scripts.

### eslint Dependencies

- eslint - Handles linting the code.
- eslint-plugin-react - Plugin for eslint to lint react code.
- eslint-plugin-react-hooks - Plugin for eslint to lint react hooks.
- eslint-plugin-react-refresh - Validate that your components can safely be updated with Fast Refresh. (Hot Reloading)
- @electron-toolkit/eslint-config-ts - TypeScript lint rules.
- @electron-toolkit/eslint-config-prettier - Prettier lint rules.

### Renderer (Frontend) Dependencies

- react - Powers the frontend.
- react-dom - Powers the frontend.
- @atlaskit/pragmatic-drag-and-drop - Helper for drag and drop tabs.
- @atlaskit/pragmatic-drag-and-drop-react-drop-indicator - Helper for drag and drop tabs.
- @iamevan/react-resizable-panels - Resizable panel layouts for the frontend.
- lucide-react - Icons for the app.
- @phosphor-icons/react - Icons for the app.
- @pdfslick/react - Powers the Experimental PDF Viewer from PDFSlick.
- @headlessui/react - Helper for the Experimental PDF Viewer from PDFSlick.
- d3-drag - Helper for the Experimental PDF Viewer from PDFSlick.
- d3-selection - Helper for the Experimental PDF Viewer from PDFSlick.
- radix-ui - UI Components for the frontend.
- motion - Animations for the frontend.
- sonner - Toast Notifications for the frontend.
- react-use - React Hooks.
- nuqs - Use for managing query parameters in the URL.

## Tailwind CSS Dependencies for the Frontend

- tailwind-merge - Merge Tailwind CSS classes.
- tailwindcss - Tailwind CSS.
- tailwindcss-animate - Tailwind CSS Animations.
- tw-animate-css - Tailwind CSS Animations.

### TypeScript Typings

- @types/chrome - Types for `chrome.*`
- @types/d3-drag - Types for `d3-drag`
- @types/d3-selection - Types for `d3-selection`
- @types/jju - Types for `jju`
- @types/node - Node typings for main process
- @types/react - Types for `react`
- @types/react-dom - Types for `react-dom`

### Uncategorized Dependencies

- @electron-toolkit/tsconfig - Extended by `tsconfig.json` with useful information for TypeScript.
- @tailwindcss/typography - Tailwind CSS Typography Plugin.
- @tailwindcss/vite - Tailwind CSS Vite Plugin.
- class-variance-authority - Class Variance Authority for Tailwind CSS.
- clsx - A tiny package for constructing `className` strings conditionally.
- cmdk - Used for building command menus.
- string-similarity-js - Use for fuzzy matching.
- hono - Used for handling and routing custom protocols. (Used and bundled into the main process)
