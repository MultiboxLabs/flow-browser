// This is used to create a simple settings framework.
// This will make it easier to add new settings and cards.

import type { BasicSetting, BasicSettingCard } from "~/types/settings";

/**
 * Maps archive tab duration settings to their equivalent values in seconds.
 * 'never' is mapped to Infinity.
 */
export const ArchiveTabValueMap = {
  "12h": 12 * 60 * 60,
  "24h": 24 * 60 * 60,
  "7d": 7 * 24 * 60 * 60,
  "30d": 30 * 24 * 60 * 60,
  never: Infinity
};

/**
 * Maps sleep tab duration settings to their equivalent values in seconds.
 * 'never' is mapped to Infinity.
 */
export const SleepTabValueMap = {
  "5m": 5 * 60,
  "10m": 10 * 60,
  "30m": 30 * 60,
  "1h": 60 * 60,
  "2h": 2 * 60 * 60,
  "4h": 4 * 60 * 60,
  "8h": 8 * 60 * 60,
  "12h": 12 * 60 * 60,
  "24h": 24 * 60 * 60,
  never: Infinity
};

export const BasicSettings: BasicSetting[] = [
  // [GENERAL] Auto Update
  {
    id: "autoUpdate",
    name: "Auto Update",
    showName: true,
    type: "boolean",
    defaultValue: true
  },

  // [GENERAL] Content Blocking
  {
    id: "contentBlocker",
    name: "Content Blocker (Built-In Adblocker)",
    showName: true,
    type: "enum",
    defaultValue: "disabled",
    options: [
      {
        id: "disabled",
        name: "Disabled"
      },
      {
        id: "adsOnly",
        name: "Block Ads"
      },
      {
        id: "adsAndTrackers",
        name: "Block Ads & Trackers"
      },
      {
        id: "all",
        name: "Block All (Cookie Notices, etc...)"
      }
    ]
  },

  // New Tab Mode
  {
    id: "newTabMode",
    name: "New Tab Mode",
    showName: false,
    type: "enum",
    defaultValue: "omnibox",
    options: [
      {
        id: "omnibox",
        name: "Command Palette"
      },
      {
        id: "tab",
        name: "Page"
      }
    ]
  },

  // Sidebar Collapse Mode
  {
    id: "sidebarCollapseMode",
    name: "Sidebar Collapse Mode",
    showName: true,
    type: "enum",
    defaultValue: "icon",
    options: [
      {
        id: "icon",
        name: "Icon"
      },
      {
        id: "offcanvas",
        name: "Off-Screen"
      }
    ]
  },

  // Sidebar Side
  {
    id: "sidebarSide",
    name: "Sidebar Side",
    showName: true,
    type: "enum",
    defaultValue: "left",
    options: [
      {
        id: "left",
        name: "Left"
      },
      {
        id: "right",
        name: "Right (Experimental)"
      }
    ]
  },

  // Archive Tab After
  {
    id: "archiveTabAfter",
    name: "Archive Tab After",
    showName: false,
    type: "enum",
    defaultValue: "12h",
    options: [
      {
        id: "12h",
        name: "12 Hours"
      },
      {
        id: "24h",
        name: "24 Hours"
      },
      {
        id: "7d",
        name: "7 Days"
      },
      {
        id: "30d",
        name: "30 Days"
      },
      {
        id: "never",
        name: "Never"
      }
    ]
  },

  // Sleep Tab After
  {
    id: "sleepTabAfter",
    name: "Sleep Tab After",
    showName: false,
    type: "enum",
    defaultValue: "never",
    options: [
      {
        id: "5m",
        name: "5 Minutes"
      },
      {
        id: "10m",
        name: "10 Minutes"
      },
      {
        id: "30m",
        name: "30 Minutes"
      },
      {
        id: "1h",
        name: "1 Hour"
      },
      {
        id: "2h",
        name: "2 Hours"
      },
      {
        id: "4h",
        name: "4 Hours"
      },
      {
        id: "8h",
        name: "8 Hours"
      },
      {
        id: "12h",
        name: "12 Hours"
      },
      {
        id: "24h",
        name: "24 Hours"
      },
      {
        id: "never",
        name: "Never"
      }
    ]
  },

  // [EXPERIMENTAL] Enable Flow PDF Viewer
  {
    id: "enableFlowPdfViewer",
    name: "Enable Flow PDF Viewer",
    showName: true,
    type: "boolean",
    defaultValue: false
  },

  // [ADVANCED] Enable mv2 extensions
  {
    id: "enableMv2Extensions",
    name: "Re-enable Manifest V2 extensions [UNSTABLE]",
    showName: true,
    type: "boolean",
    defaultValue: false
  }
];

export const BasicSettingCards: BasicSettingCard[] = [
  // General Card
  {
    title: "General Settings",
    subtitle: "General settings for the application",
    settings: ["autoUpdate", "contentBlocker", "internal_setAsDefaultBrowser"]
  },

  // Update Card (Internal)
  {
    title: "INTERNAL_UPDATE",
    subtitle: "",
    settings: []
  },

  // New Tab Mode Card
  {
    title: "New Tab Mode",
    subtitle: "Choose how new tabs should open",
    settings: ["newTabMode"]
  },

  // Sidebar Settings Card
  {
    title: "Sidebar Settings",
    subtitle: "Choose how the sidebar should behave",
    settings: ["sidebarSide", "sidebarCollapseMode"]
  },

  // Performance Settings Card
  {
    title: "Performance Settings",
    subtitle: "Settings to improve performance",
    settings: ["archiveTabAfter", "sleepTabAfter"]
  },

  // Onboarding Card (Internal)
  {
    title: "INTERNAL_ONBOARDING",
    subtitle: "",
    settings: []
  },

  // Experimental Settings Card
  {
    title: "Experimental Settings",
    subtitle: "Experimental settings for Flow",
    settings: ["enableFlowPdfViewer"]
  },

  // Advanced Settings Card
  {
    title: "Advanced Settings",
    subtitle: "Power users only (Some settings may require a restart)",
    settings: ["enableMv2Extensions"]
  }
];
