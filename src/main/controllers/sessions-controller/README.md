# SessionsController

This handles the raw sessions from `electron` and configure them so they are useful for the browser.

## Components

- `./index.ts` - Main interface exposed to grab and create sessions
- `./default-session` - Handles the default session and its initialization
- `./handlers` - Handles the callbacks and permissions for the sessions
- `./intercept-rules` - Handles the intercept rules for the sessions
- `./preload-scripts` - Handles the preload scripts for the sessions
- `./protocols` - Handles all the custom protocols and let them be registered to sessions
- `./web-requests` - Handles the web requests for the sessions

## External Usage

- The only thing that should be required outside of this controller is the `index.ts` file.
- All other files are internal and should not be used outside of this controller.
