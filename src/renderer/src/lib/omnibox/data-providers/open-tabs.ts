export async function getOpenTabsInSpace() {
  const spaceId = await flow.spaces.getUsingSpace();
  if (!spaceId) return [];

  const tabsData = await flow.tabService.getData();

  const tabs = tabsData.tabs.filter((tab) => tab.spaceId === spaceId);
  return tabs;
}
