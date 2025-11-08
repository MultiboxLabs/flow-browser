# WindowsController

This handles all `BrowserWindows` from `electron` and seperates them into different types of windows to easily manage them.

## Components

- `./index.ts` - Main interface exposed to grab all windows (not creating new ones!)
- `./type-manager.ts` - A helper class to manage and let you create new windows of a specific type
- `./interfaces` - Interfaces for the windows controller for external use
- `./types` - Window classes for each type of windows (and the base window class)
- `./utils` - Handles the utilities for the windows

## External Usage

- The only thing that should be required outside of this controller is the `index.ts` file and interfaces in the `./interfaces` directory.
- All other files are internal and should not be used outside of this controller.
