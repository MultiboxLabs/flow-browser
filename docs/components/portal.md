# Portal Component

## Overview

The Portal component allows content to be rendered outside of the main DOM hierarchy into a separate window. This is particularly useful for creating floating UI elements like modals, tooltips, and popovers that need to break out of their parent container's bounds.

## Key Features

- Renders content in a separate browser window with precise positioning
- Synchronizes styles between the main document and the portal window
- Supports dynamic positioning and size adjustments
- Maintains proper z-index ordering
- Automatically closes the portal window when the component unmounts

## Architecture

The Portal component is implemented as a client-server system:

1. **Frontend (React)**: The `PortalComponent` in the React application creates window instances and manages their content
2. **Backend (Electron)**: The `portal-component-windows.ts` module in the Electron process manages the actual window views and handles positioning

This separation allows for creating true native windows while maintaining React's component lifecycle and rendering model.

## API Reference

### PortalComponent

The main component that creates and manages the portal window.

```tsx
import { PortalComponent } from "@/components/portal/portal";

<PortalComponent
  x={100} // X position in pixels
  y={200} // Y position in pixels
  width="300px" // Width as CSS value
  height="200px" // Height as CSS value
  zIndex={5} // Optional z-index (default: 3)
  ref={portalRef} // Optional ref to the portal container
>
  {/* Content to render in the portal */}
  <div>Portal content goes here</div>
</PortalComponent>;
```

#### Props

| Prop       | Type      | Required | Default | Description                              |
| ---------- | --------- | -------- | ------- | ---------------------------------------- |
| `x`        | number    | Yes      | -       | Horizontal position of the portal window |
| `y`        | number    | Yes      | -       | Vertical position of the portal window   |
| `width`    | string    | Yes      | -       | Width of the portal window (CSS value)   |
| `height`   | string    | Yes      | -       | Height of the portal window (CSS value)  |
| `zIndex`   | number    | No       | 3       | Z-index of the portal window             |
| `ref`      | RefObject | No       | -       | Reference to the portal's HTML element   |
| `children` | ReactNode | Yes      | -       | Content to render inside the portal      |

## Implementation Details

### Frontend Implementation

#### Window Creation

The portal component creates a new browser window using `window.open()` with a unique identifier. This window serves as the container for the portal content.

#### Style Synchronization

The component uses a custom hook (`useCopyStyles`) to ensure that all styles from the main document are copied to the portal window:

- Copies all `<style>` and `<link rel="stylesheet">` elements from the main document
- Uses a MutationObserver to detect style changes and keep styles synchronized
- Handles matching and de-duplication of styles to prevent unnecessary copies

#### Component Lifecycle

1. **Mount**: Creates a new window, sets up style synchronization
2. **Update**: Updates position and size when props change
3. **Unmount**: Closes the window and cleans up resources

#### Positioning and Sizing

- Uses Flow Browser's interface to position the window (`flow.interface.setComponentWindowBounds`)
- Converts CSS size values to pixels with the `useCssSizeToPixels` hook

### Backend Implementation

The Electron side of the Portal component is implemented in `electron/browser/components/portal-component-windows.ts`:

#### Core Functions

- `initializePortalComponentWindows`: Sets up IPC handlers and manages component views
- `setComponentWindowBounds`: Updates the position and size of component windows
- `setComponentWindowZIndex`: Controls the stacking order of component windows

#### Window Management

- Uses Electron's `WebContentsView` to create lightweight views for portal content
- Maintains a registry of component windows with their IDs
- Handles window destruction and resource cleanup

#### IPC Communication

The backend exposes two main IPC channels:

- `interface:set-component-window-bounds`: Updates position and dimensions of component windows
- `interface:set-component-window-z-index`: Controls the stacking order of component windows

## Related Components

### PortalPopover

A specialized component built on top of the basic Portal for creating popover UI elements.

```tsx
import { PortalPopover } from "@/components/portal/popover";

<PortalPopover.Root>
  <Trigger>Open Popover</Trigger>
  <PortalPopover.Content>Popover content rendered in a portal</PortalPopover.Content>
</PortalPopover.Root>;
```

## Usage Guidelines

- Use portals sparingly, only when content needs to break out of container constraints
- Consider z-index carefully to ensure proper layering of multiple portals
- Remember that portal windows are separate DOM trees, so context providers in the main application won't be available in the portal
- For simple cases where content just needs to break out of overflow constraints, consider CSS solutions first

## Contribution Guidelines

When modifying the Portal component:

1. Ensure backward compatibility with existing uses of the component
2. Test thoroughly with different window sizes and positions
3. Verify that style synchronization works for all use cases
4. Check for memory leaks, especially in cleanup functions
5. Consider performance implications, especially with multiple portals

### Backend Development Notes

When working on the Electron implementation:

1. The `componentViews` object maintains references to all active portal views
2. The default z-index for portal windows is 3 (defined in both frontend and backend)
3. WebContentsView cleanup happens automatically via the 'destroyed' event
4. For debugging, you can enable DevTools for portal windows by setting `DEBUG_ENABLE_DEVTOOLS` to true

## Technical Considerations

- The portal uses Flow Browser's native window management capabilities
- Electron's `WebContentsView` instances are used instead of traditional windows for better integration
- Style synchronization can be complex and may need adjustments for specific CSS features
- Window objects must be properly cleaned up to prevent resource leaks
- IPC channels connect the React frontend to the Electron backend
