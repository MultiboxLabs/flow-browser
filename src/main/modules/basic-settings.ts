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

export const BasicSettings: BasicSetting[] = [
  // [GENERAL] Auto Update
  {
    id: "autoUpdate",
    name: "Auto Update",
    showName: true,
    type: "boolean",
    defaultValue: true
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
    settings: ["autoUpdate", "internal_setAsDefaultBrowser"]
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

  // Archive Tab After Card
  {
    title: "Archive Tab After",
    subtitle: "Choose how long tabs should be archived",
    settings: ["archiveTabAfter"]
  },

  // Onboarding Card (Internal)
  {
    title: "INTERNAL_ONBOARDING",
    subtitle: "",
    settings: []
  },

  // Advanced Settings Card
  {
    title: "Advanced Settings",
    subtitle: "Power users only (Some settings may require a restart)",
    settings: ["enableMv2Extensions"]
  }
];
