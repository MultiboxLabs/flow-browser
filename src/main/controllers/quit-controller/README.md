# QuitController

This creates control over the quitting behaviour of the application by letting you run callbacks before quitting.

## Components

- `./index.ts` - Main interface exposed to check quit status and handle callbacks internally
- `./handlers` - Stores the callbacks that should be ran before quitting

## External Usage

- The only thing that should be required outside of this controller is the `index.ts` file.
- All other files are internal and should not be used outside of this controller.
