// This is used to create a simple settings framework.
// This will make it easier to add new settings and cards.

import type { BasicSetting, BasicSettingCard } from "~/types/settings";

export const BasicSettings: BasicSetting[] = [
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
    showName: false,
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
  }
];

export const BasicSettingCards: BasicSettingCard[] = [
  // New Tab Mode Card
  {
    title: "New Tab Mode",
    subtitle: "Choose how new tabs should open",
    settings: ["newTabMode"]
  },

  // Sidebar Collapse Mode Card
  {
    title: "Sidebar Collapse Mode",
    subtitle: "Choose how the sidebar should collapse",
    settings: ["sidebarCollapseMode"]
  },

  // Archive Tab After Card
  {
    title: "Archive Tab After",
    subtitle: "Choose how long tabs should be archived",
    settings: ["archiveTabAfter"]
  }
];
