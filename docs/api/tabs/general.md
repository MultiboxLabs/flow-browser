# Tabs General Documentation

## Success Creteria

- Have different active tab groups in different spaces
- Tabs in sidebar achievable
- Different tab groups in different places visible at once
- Have different containers in a Space ("Favourite", "Pinned", "Normal")

## Managers

- Tab Manager
- Tab Group Manager
- Active Tab Group Manager
- Tabs Container Manager

## Objects

- Tab
- Tab Group
- Tab Container

## TODO APIs

- TabGroup.transferTab() -> boolean (transfer tab to another tab group, true if success & false if failed)
- TabGroup.createTab() -> Tab (added to TabGroup automatically)
- TabContainer.newNormalTabGroup() -> NormalTabGroup (added to TabContainer automatically)

## How to:

### Create a new tab

1. Create a new tab group via TabContainer.newNormalTabGroup()
2. Create a new tab via TabGroup.createTab()

### Change a Tab Group's Tab Container

- **TODO!**

### Create a Tab Folder

1. Run TabContainer.createTabFolder()
