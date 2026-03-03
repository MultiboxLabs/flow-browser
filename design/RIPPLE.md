# Ripple — AI Browsing & Work Agent

Ripple is an AI agent integrated into Flow Browser, powered by the OpenCode SDK (`@opencode-ai/sdk`). It has two modes:

- **Browse Mode** — A second sidebar (opposite side of the main sidebar) with a chat interface. The agent interacts with the current website via MCP browser tools. No filesystem access by default (user can opt in).
- **Work Mode** — A dedicated page at `flow://ripple` with a chat-focused interface for working on the user's desktop and filesystem.

## Architecture

```
┌─────────────────── Electron Main Process ──────────────────────┐
│                                                                 │
│  ┌─────────────────┐   ┌─────────────────────────────────────┐ │
│  │  RippleService   │──▶│  OpenCode Server (via SDK)          │ │
│  │  - lifecycle     │   │  - Browse agent (restricted tools)  │ │
│  │  - sessions      │   │  - Work agent (full tools)          │ │
│  │  - IPC bridge    │   │                                     │ │
│  └─────────────────┘   │  ┌──────────────────────────┐       │ │
│                         │  │ MCP Browser Tools Server │       │ │
│                         │  │ (HTTP, in-process)       │       │ │
│                         │  │ - get_page_content       │       │ │
│  ┌─────────────────┐   │  │ - navigate               │       │ │
│  │  TabsController  │◀──│  │ - click / type / scroll  │       │ │
│  │  (webContents)   │   │  │ - evaluate_js            │       │ │
│  └─────────────────┘   │  │ - screenshot              │       │ │
│                         │  └──────────────────────────┘       │ │
│                         └─────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │ IPC (flow.ripple.*)
┌──────────────────────────────▼──────────────────────────────────┐
│                    Renderer Process                              │
│                                                                  │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │  Main     │  │  Browser Content  │  │  Ripple Sidebar      │  │
│  │  Sidebar  │  │  (WebContentsView)│  │  (Chat UI)           │  │
│  │  (left)   │  │                   │  │  (right)             │  │
│  └──────────┘  └──────────────────┘  └───────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  flow://ripple (Work Mode - full page)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Key Decisions

| Decision                | Choice                                                    | Rationale                                                                |
| ----------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| OpenCode binary         | Require user installation                                 | Simpler, always up-to-date, user controls their own install              |
| Page content access     | MCP browser tools                                         | Interactive browsing — agent can read, navigate, and interact with pages |
| Ripple sidebar position | Always opposite side of main sidebar                      | Avoids overlap confusion                                                 |
| MCP server location     | HTTP server in Electron main process                      | Direct access to webContents APIs, no extra IPC bridge                   |
| Browse vs Work tools    | Custom OpenCode agents                                    | Browse agent gets only MCP browser tools; Work agent gets everything     |
| Work Mode UI            | Chat-focused                                              | Simple chat interface, not a full IDE experience                         |
| Session model           | One session per tab (Browse), independent sessions (Work) | Each tab's conversation stays contextual to that page                    |

---

## Phase 0: Dependencies & Foundation

### 0.1 Install dependencies

- `@opencode-ai/sdk` — OpenCode client/server management
- `@modelcontextprotocol/sdk` — MCP server implementation

### 0.2 Shared types

Define Ripple-specific types in `src/shared/`:

- `RippleSession`, `RippleMessage`, `RippleMode` (`"browse"` | `"work"`)
- Extend `PageLayoutParams` to support two sidebars

**`PageLayoutParams` extension:**

```ts
interface PageLayoutParams {
  // ... existing fields unchanged ...

  // Ripple sidebar (always on opposite side of sidebarSide)
  rippleSidebarWidth: number;
  rippleSidebarVisible: boolean;
  rippleSidebarAnimating: boolean;
}
```

The ripple sidebar side is always the opposite of `sidebarSide`, so no explicit side field is needed.

---

## Phase 1: Two-Sidebar Layout Support

### 1.1 `RippleSidebarProvider`

**New file:** `src/renderer/src/components/browser-ui/ripple-sidebar/provider.tsx`

- Independent React Context (separate from `BrowserSidebarProvider`)
- Manages: `isVisible`, `isAnimating`, `width` (persisted to localStorage as `RIPPLE_SIDEBAR_SIZE`)
- Reads `attachedDirection` from `BrowserSidebarProvider` to derive its own side (always opposite)
- Toggle via IPC and keyboard shortcut

### 1.2 Layout changes (`main.tsx`)

Current: `[PresenceSidebar(left)] [main] [PresenceSidebar(right)]`

New: The existing `PresenceSidebar` slots remain unchanged. A new `RippleSidebar` slot is added on the opposite side.

The `ResizablePanelGroup` gains an additional `PixelBasedResizablePanel` for the Ripple sidebar with its own resize handle.

### 1.3 `BrowserContent` changes

- Consume both `BrowserSidebarProvider` and `RippleSidebarProvider`
- Send `rippleSidebarWidth`, `rippleSidebarVisible`, `rippleSidebarAnimating` in layout params

### 1.4 Main process bounds computation (`browser.ts`)

```ts
// Current:
const x = (sidebarSide === "left" ? effectiveSidebarWidth : 0) + PADDING;
const width = cw - effectiveSidebarWidth - PADDING * 2;

// New:
const rippleSide = sidebarSide === "left" ? "right" : "left";
const leftWidth = sidebarSide === "left" ? effectiveMainSidebarWidth : effectiveRippleSidebarWidth;
const rightWidth = sidebarSide === "right" ? effectiveMainSidebarWidth : effectiveRippleSidebarWidth;
const x = leftWidth + PADDING;
const width = Math.max(0, cw - leftWidth - rightWidth - PADDING * 2);
```

### 1.5 Second `SidebarInterpolation`

The main process tracks two independent interpolations. A separate `rippleSidebarInterpolation` field is added to `BrowserWindowInstance`.

### 1.6 IPC for sidebar toggle

- `flow.interface.onToggleRippleSidebar` — main process can toggle the Ripple sidebar
- Add to preload with `"browser"` permission level

---

## Phase 2: MCP Browser Tools Server

### 2.1 Module

**New file:** `src/main/modules/ripple/mcp-browser-server.ts`

- Uses `@modelcontextprotocol/sdk` with Streamable HTTP transport
- Runs on a dynamic localhost port (auto-assigned)
- Has direct access to `tabsController` and `windowsController`

### 2.2 Browser tools

| Tool                     | Description                                  | Implementation                                             |
| ------------------------ | -------------------------------------------- | ---------------------------------------------------------- |
| `get_page_content`       | Returns page text, HTML, or readable content | `webContents.executeJavaScript()` to extract DOM           |
| `get_page_url`           | Returns current page URL                     | `webContents.getURL()`                                     |
| `get_page_title`         | Returns page title                           | `webContents.getTitle()`                                   |
| `navigate`               | Navigate to a URL                            | `webContents.loadURL()`                                    |
| `go_back` / `go_forward` | Navigation history                           | `webContents.goBack/goForward()`                           |
| `click_element`          | Click an element by CSS selector             | `executeJavaScript('document.querySelector(...).click()')` |
| `type_text`              | Type text into an input                      | `executeJavaScript` + `webContents.insertText()`           |
| `scroll_page`            | Scroll page by amount                        | `executeJavaScript('window.scrollBy()')`                   |
| `evaluate_js`            | Run arbitrary JavaScript                     | `webContents.executeJavaScript()`                          |
| `screenshot`             | Take a page screenshot                       | `webContents.capturePage()`                                |
| `get_page_links`         | List all links on the page                   | `executeJavaScript` to collect `<a>` elements              |
| `get_page_inputs`        | List all form inputs                         | `executeJavaScript` to collect form elements               |

### 2.3 Window/tab targeting

- Tools receive an optional `tabId` parameter
- Default: the focused tab in the window that invoked Ripple
- MCP server resolves the tab ID to a `webContents` instance via `tabsController`

---

## Phase 3: OpenCode Integration (Main Process)

### 3.1 `RippleService`

**New file:** `src/main/modules/ripple/service.ts`

- Manages the opencode server lifecycle
- Lazy initialization — starts on first Ripple activation
- Handles errors (opencode not found, server crash, etc.)

```ts
class RippleService {
  private opencode: Awaited<ReturnType<typeof createOpencode>> | null = null;

  async initialize() {
    this.opencode = await createOpencode({
      config: {
        mcpServers: {
          "flow-browser": {
            url: `http://localhost:${this.mcpPort}/mcp`
          }
        }
      }
    });
  }

  async createBrowseSession(windowId: string, tabId: string) {
    /* ... */
  }
  async createWorkSession() {
    /* ... */
  }
  async sendMessage(sessionId: string, text: string) {
    /* ... */
  }
  async abort(sessionId: string) {
    /* ... */
  }
}
```

### 3.2 Agent configurations

- **Browse agent**: Only MCP browser tools. No filesystem access by default. When the user enables filesystem access, the agent gains file read/write tools.
- **Work agent**: Full OpenCode agent with all default tools + MCP browser tools.

### 3.3 Session management

- Each tab has its own Browse session (created on first message, associated by `tabId`)
- Work mode has independent sessions (persisted by OpenCode)
- Sessions survive sidebar toggles but are associated with the window + tab

---

## Phase 4: IPC Bridge

### 4.1 IPC channels

**New file:** `src/main/ipc/ripple.ts`

| Channel                   | Type   | Description                                       |
| ------------------------- | ------ | ------------------------------------------------- |
| `ripple:initialize`       | handle | Start the opencode server                         |
| `ripple:get-status`       | handle | Check server status                               |
| `ripple:create-session`   | handle | Create a new session (browse or work)             |
| `ripple:send-prompt`      | handle | Send a message and stream the response            |
| `ripple:abort`            | handle | Abort current generation                          |
| `ripple:get-sessions`     | handle | List sessions                                     |
| `ripple:get-messages`     | handle | Get messages for a session                        |
| `ripple:toggle-fs-access` | handle | Enable/disable filesystem tools for browse mode   |
| `ripple:subscribe-events` | on     | Subscribe to SSE events (forwarded from OpenCode) |

### 4.2 Preload API extension

```ts
flow.ripple = {
  initialize: () => ipcRenderer.invoke("ripple:initialize"),
  getStatus: () => ipcRenderer.invoke("ripple:get-status"),
  createSession: (mode, tabId?) => ipcRenderer.invoke("ripple:create-session", mode, tabId),
  sendPrompt: (sessionId, text) => ipcRenderer.invoke("ripple:send-prompt", sessionId, text),
  abort: (sessionId) => ipcRenderer.invoke("ripple:abort", sessionId),
  getSessions: () => ipcRenderer.invoke("ripple:get-sessions"),
  getMessages: (sessionId) => ipcRenderer.invoke("ripple:get-messages", sessionId),
  toggleFsAccess: (sessionId, enabled) => ipcRenderer.invoke("ripple:toggle-fs-access", sessionId, enabled),
  onEvent: (callback) => listenOnIPCChannel("ripple:event", callback)
};
```

- Permission: `"app"` (available to all `flow://` and `flow-internal://` pages)

---

## Phase 5: Browse Mode UI (Ripple Sidebar)

### 5.1 Component structure

```
src/renderer/src/components/browser-ui/ripple-sidebar/
├── provider.tsx          # RippleSidebarProvider (state management)
├── component.tsx         # RippleSidebar (attached/floating variants)
├── inner.tsx             # Sidebar content wrapper
└── _components/
    ├── chat-messages.tsx  # Message list with markdown rendering
    ├── chat-input.tsx     # Text input + send button + abort
    ├── message-bubble.tsx # Individual message (user/assistant)
    ├── tool-call.tsx      # Rendered tool call results (collapsible)
    ├── settings-panel.tsx # FS access toggle, model selector
    └── session-list.tsx   # Session history
```

### 5.2 Chat interface design

- **Header**: "Ripple" label, session dropdown, settings gear icon
- **Messages area**: Scrollable list, user messages right-aligned, assistant messages left-aligned
- **Tool calls**: Inline collapsible cards (e.g., "Read page content", "Navigated to...")
- **Input area**: Textarea with placeholder "Ask about this page...", send button, abort button during generation
- **Settings panel**: Slide-in panel with filesystem access toggle, model selector

### 5.3 Event streaming

- OpenCode's `event.subscribe()` API streams events via IPC
- Main process subscribes to OpenCode events and forwards relevant ones to the renderer via the `ripple:event` IPC channel

### 5.4 Keyboard shortcut

- Toggle: `Cmd+Shift+R` / `Ctrl+Shift+R`
- Added to the shortcuts system in settings

---

## Phase 6: Work Mode (`flow://ripple`)

### 6.1 Route

**New files:**

- `src/renderer/src/routes/ripple/config.tsx`
- `src/renderer/src/routes/ripple/page.tsx`

### 6.2 Static domain registration

Add to `static-domains/config.ts`:

```ts
{ protocol: "flow", hostname: "ripple", actual: { type: "route", route: "ripple" } }
```

Build system auto-generates `main.tsx` and `route-ripple.html`.

### 6.3 Work Mode UI

- Simple chat-focused interface (full page width)
- Session list in a collapsible left panel
- Inline file references when the agent reads/writes files
- Inline terminal output when the agent runs shell commands
- Full filesystem + browser access by default

---

## Phase 7: Settings & Polish

### 7.1 Settings

Add a "Ripple" section in `flow-internal://settings`:

- **Provider/Model**: Which AI provider and model to use
- **API Key management**: Input fields for provider API keys
- **Keyboard shortcut**: Customizable toggle shortcut
- **Filesystem access default**: Whether Browse Mode starts with FS access enabled

### 7.2 Onboarding

- On first Ripple activation, check if `opencode` is in `$PATH`
- If not found, show inline message with installation instructions

### 7.3 Error handling

- OpenCode binary not found → error message with install link
- Server crash → auto-restart with exponential backoff
- API key missing → prompt to configure in settings

---

## Implementation Order

| #   | Phase                         | Effort | Dependencies |
| --- | ----------------------------- | ------ | ------------ |
| 1   | Phase 0: Dependencies & types | Small  | None         |
| 2   | Phase 2: MCP Browser Server   | Medium | Phase 0      |
| 3   | Phase 3: OpenCode integration | Medium | Phase 0, 2   |
| 4   | Phase 4: IPC Bridge           | Small  | Phase 3      |
| 5   | Phase 1: Two-sidebar layout   | Large  | Phase 0      |
| 6   | Phase 5: Browse Mode UI       | Large  | Phase 1, 4   |
| 7   | Phase 6: Work Mode page       | Medium | Phase 4      |
| 8   | Phase 7: Settings & polish    | Medium | Phase 5, 6   |

Phases 1 (layout) and 2-4 (backend) can be developed in parallel.

---

## Files to Create

| File                                                                      | Purpose                                              |
| ------------------------------------------------------------------------- | ---------------------------------------------------- |
| `src/main/modules/ripple/service.ts`                                      | RippleService — server lifecycle, session management |
| `src/main/modules/ripple/mcp-browser-server.ts`                           | MCP browser tools server                             |
| `src/main/modules/ripple/types.ts`                                        | Shared types for Ripple                              |
| `src/main/ipc/ripple.ts`                                                  | IPC handler registration                             |
| `src/renderer/src/components/browser-ui/ripple-sidebar/provider.tsx`      | Sidebar state                                        |
| `src/renderer/src/components/browser-ui/ripple-sidebar/component.tsx`     | Sidebar shell                                        |
| `src/renderer/src/components/browser-ui/ripple-sidebar/inner.tsx`         | Sidebar content                                      |
| `src/renderer/src/components/browser-ui/ripple-sidebar/_components/*.tsx` | Chat UI components                                   |
| `src/renderer/src/routes/ripple/config.tsx`                               | Work Mode route config                               |
| `src/renderer/src/routes/ripple/page.tsx`                                 | Work Mode page component                             |
| `src/shared/flow/interfaces/ripple/interface.ts`                          | Ripple IPC type definitions                          |

## Files to Modify

| File                                                                          | Change                                                   |
| ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| `package.json`                                                                | Add `@opencode-ai/sdk`, `@modelcontextprotocol/sdk`      |
| `src/shared/flow/types.ts`                                                    | Extend `PageLayoutParams` with ripple sidebar fields     |
| `src/renderer/src/components/browser-ui/main.tsx`                             | Add Ripple sidebar slot, add `RippleSidebarProvider`     |
| `src/renderer/src/components/browser-ui/browser-content.tsx`                  | Send ripple sidebar params                               |
| `src/main/controllers/windows-controller/types/browser.ts`                    | Update `recomputePageBounds()`, add ripple interpolation |
| `src/main/ipc/index.ts`                                                       | Import ripple IPC handlers                               |
| `src/preload/index.ts`                                                        | Add `flow.ripple.*` API, update permissions              |
| `src/main/controllers/sessions-controller/protocols/static-domains/config.ts` | Add `flow://ripple` mapping                              |
| `src/shared/flow/flow.ts`                                                     | Add ripple types to global `flow` declaration            |
| `src/main/modules/basic-settings.ts`                                          | Add Ripple settings definitions                          |
