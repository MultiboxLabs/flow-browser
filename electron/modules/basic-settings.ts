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
  }
];
