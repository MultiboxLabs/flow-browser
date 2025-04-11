# Domain Router

This router is for domain-based routing.

## Overview

The Domain Router allows for routing based on the domain origin and location information. It provides access to the current URL state through a React context.

## Components

- **RouterProvider**: Wraps your application and provides router context.
- **Route**: A component that conditionally renders based on the origin.

## Usage

```tsx
// Wrap your application with RouterProvider
import { RouterProvider } from "./router/provider";

function App() {
  return <RouterProvider>{/* Your app components */}</RouterProvider>;
}

// Use Route component to conditionally render based on domain
import { Route } from "./router/route";

function DomainSpecificComponent() {
  return (
    <Route origin="https://example.com">
      <YourComponent />
    </Route>
  );
}

// Access router information in any component
import { useRouter } from "./router/provider";

function NavigationComponent() {
  const { pathname, search, hash } = useRouter();

  // Use router information
  return <div>Current path: {pathname}</div>;
}
```

## Creator

Created by [iamEvan](https://github.com/iamEvanYT)
