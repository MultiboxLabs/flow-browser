// src/renderer/src/components/providers/tabs-provider.test.tsx
import React from 'react';
import { render, act } from '@testing-library/react'; // Conceptual: using testing-library
import { TabsProvider, useTabs, TabGroup as ClientTabGroup } from './tabs-provider';
import { WindowTabsData, TabData, TabGroupData } from '~/types/tabs'; // Ensure path is correct

// --- Mocks ---

// Mock useSpaces hook
const mockUseSpaces = {
  currentSpace: { id: 'space1', profileId: 'profile1' },
  // ... other properties if needed
};
jest.mock('@/components/providers/spaces-provider', () => ({
  useSpaces: jest.fn(() => mockUseSpaces),
}));

// Mock flow IPC calls
let mockWindowTabsData: WindowTabsData | null = null;
let onDataUpdatedCallback: ((data: WindowTabsData) => void) | null = null;

const mockFlowTabsAPI = {
  getData: jest.fn(async () => {
    if (mockWindowTabsData === null) {
      throw new Error('mockWindowTabsData not set for getData');
    }
    return mockWindowTabsData;
  }),
  onDataUpdated: jest.fn((callback: (data: WindowTabsData) => void) => {
    onDataUpdatedCallback = callback;
    return jest.fn(); // Return an unsubscribe function
  }),
  // Mock other flow.tabs.* calls if they were used directly by the provider for actions
  // For now, focusing on data consumption.
};

// @ts-ignore
global.flow = {
  tabs: mockFlowTabsAPI,
  // ... other flow APIs if necessary
};

// Mock transformUrl utility
jest.mock('@/lib/url', () => ({
  transformUrl: jest.fn((url) => url), // Simple pass-through mock
}));


// --- Test Helper ---
const TestConsumer: React.FC<{ onRender: (contextValue: any) => void }> = ({ onRender }) => {
  const tabsContext = useTabs();
  onRender(tabsContext);
  return null;
};

// --- Test Suite ---

describe('TabsProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindowTabsData = null; // Reset mock data for each test
    onDataUpdatedCallback = null;
    mockUseSpaces.currentSpace = { id: 'space1', profileId: 'profile1' }; // Reset space
  });

  const setupMockData = (data: WindowTabsData) => {
    mockWindowTabsData = data;
  };

  test('should correctly process WindowTabsData and associate tabs with groups via groupId', async () => {
    const tab1: TabData = { id: 1, groupId: 100, spaceId: 'space1', title: 'Tab 1', url: 'url1', profileId: 'p1' } as TabData;
    const tab2: TabData = { id: 2, groupId: 101, spaceId: 'space1', title: 'Tab 2', url: 'url2', profileId: 'p1' } as TabData;
    const tab3: TabData = { id: 3, groupId: 100, spaceId: 'space1', title: 'Tab 3', url: 'url3', profileId: 'p1' } as TabData;

    const group1: TabGroupData = { id: 100, mode: 'normal', spaceId: 'space1', profileId: 'p1', tabIds: [1, 3] }; // tabIds from main might still be there
    const group2: TabGroupData = { id: 101, mode: 'normal', spaceId: 'space1', profileId: 'p1', tabIds: [2] };

    setupMockData({
      tabs: [tab1, tab2, tab3],
      tabGroups: [group1, group2],
      activeTabIds: { 'space1': [1] }, // Tab 1 is active
      focusedTabIds: { 'space1': 1 },  // Tab 1 is focused
    });

    let contextValue: any;
    await act(async () => {
      render(
        <TabsProvider>
          <TestConsumer onRender={(val) => contextValue = val} />
        </TabsProvider>
      );
    });

    expect(mockFlowTabsAPI.getData).toHaveBeenCalledTimes(1);
    expect(contextValue.tabGroups).toHaveLength(2);

    const clientGroup100 = contextValue.tabGroups.find((g: ClientTabGroup) => g.id === 100);
    const clientGroup101 = contextValue.tabGroups.find((g: ClientTabGroup) => g.id === 101);

    expect(clientGroup100).toBeDefined();
    expect(clientGroup100.tabs).toHaveLength(2);
    expect(clientGroup100.tabs).toEqual(expect.arrayContaining([tab1, tab3]));
    expect(clientGroup100.active).toBe(true); // Tab 1 (in group 100) is active
    expect(clientGroup100.focusedTab).toBe(tab1); // Tab 1 (in group 100) is focused

    expect(clientGroup101).toBeDefined();
    expect(clientGroup101.tabs).toHaveLength(1);
    expect(clientGroup101.tabs).toEqual(expect.arrayContaining([tab2]));
    expect(clientGroup101.active).toBe(false);
    expect(clientGroup101.focusedTab).toBeNull();

    // Check that no synthetic groups (e.g., with ID tab.id + 999) were created
    contextValue.tabGroups.forEach((g: ClientTabGroup) => {
        expect(g.id).toBeLessThanOrEqual(101); // Based on test data
    });
  });

  test('should not create synthetic groups if all tabs have a groupId mapping to a group', async () => {
    const tab1: TabData = { id: 1, groupId: 100, spaceId: 'space1', title: 'Tab 1' } as TabData;
    const group1: TabGroupData = { id: 100, mode: 'normal', spaceId: 'space1', profileId: 'p1', tabIds: [1] };
    
    setupMockData({
      tabs: [tab1],
      tabGroups: [group1],
      activeTabIds: { 'space1': [1] },
      focusedTabIds: { 'space1': 1 },
    });

    let contextValue: any;
    await act(async () => {
      render(
        <TabsProvider>
          <TestConsumer onRender={(val) => contextValue = val} />
        </TabsProvider>
      );
    });
    
    expect(contextValue.tabGroups).toHaveLength(1);
    const clientGroup100 = contextValue.tabGroups[0];
    expect(clientGroup100.id).toBe(100);
    expect(clientGroup100.tabs).toHaveLength(1);
    expect(clientGroup100.tabs[0].id).toBe(tab1.id);
  });

  test('should handle empty tabsData gracefully', async () => {
    setupMockData({ tabs: [], tabGroups: [], activeTabIds: {}, focusedTabIds: {} });
    let contextValue: any;
    await act(async () => {
      render(
        <TabsProvider>
          <TestConsumer onRender={(val) => contextValue = val} />
        </TabsProvider>
      );
    });
    expect(contextValue.tabGroups).toEqual([]);
    expect(contextValue.activeTabGroup).toBeNull();
    expect(contextValue.focusedTab).toBeNull();
  });

  test('should update context when onDataUpdated is triggered', async () => {
    const initialTab: TabData = { id: 1, groupId: 100, spaceId: 'space1', title: 'Initial Tab' } as TabData;
    const initialGroup: TabGroupData = { id: 100, mode: 'normal', spaceId: 'space1', profileId: 'p1', tabIds: [1] };
    setupMockData({
      tabs: [initialTab],
      tabGroups: [initialGroup],
      activeTabIds: { 'space1': [1] },
      focusedTabIds: { 'space1': 1 },
    });

    let contextValue: any;
    await act(async () => {
      render(
        <TabsProvider>
          <TestConsumer onRender={(val) => contextValue = val} />
        </TabsProvider>
      );
    });

    expect(contextValue.tabGroups[0].tabs[0].title).toBe('Initial Tab');

    const updatedTab: TabData = { id: 1, groupId: 100, spaceId: 'space1', title: 'Updated Tab' } as TabData; // Same tab, updated title
    const updatedTab2: TabData = { id: 2, groupId: 101, spaceId: 'space1', title: 'New Tab 2' } as TabData;
    const updatedGroup2: TabGroupData = { id: 101, mode: 'normal', spaceId: 'space1', profileId: 'p1', tabIds: [2] };
    
    const newMockData: WindowTabsData = {
      tabs: [updatedTab, updatedTab2],
      tabGroups: [initialGroup, updatedGroup2], // initialGroup still refers to tabId 1 by its old definition
      activeTabIds: { 'space1': [2] }, // Tab 2 is now active
      focusedTabIds: { 'space1': 2 },
    };

    expect(onDataUpdatedCallback).not.toBeNull();
    await act(async () => {
      if (onDataUpdatedCallback) {
        onDataUpdatedCallback(newMockData);
      }
    });
    
    expect(contextValue.tabGroups).toHaveLength(2);
    const clientGroup100 = contextValue.tabGroups.find((g: ClientTabGroup) => g.id === 100);
    const clientGroup101 = contextValue.tabGroups.find((g: ClientTabGroup) => g.id === 101);

    expect(clientGroup100.tabs[0].title).toBe('Updated Tab');
    expect(clientGroup101.tabs[0].title).toBe('New Tab 2');
    expect(contextValue.activeTabGroup.id).toBe(101); // Group 101 should be active because tab 2 is active
    expect(contextValue.focusedTab.id).toBe(2);
  });

  test('getActiveTabGroup and getFocusedTab should correctly use groupId and spaceId', async () => {
    const tab1s1: TabData = { id: 1, groupId: 100, spaceId: 'space1', title: 'Tab 1 Space 1' } as TabData;
    const tab2s1: TabData = { id: 2, groupId: 100, spaceId: 'space1', title: 'Tab 2 Space 1' } as TabData;
    const tab1s2: TabData = { id: 3, groupId: 102, spaceId: 'space2', title: 'Tab 1 Space 2' } as TabData;

    const group100s1: TabGroupData = { id: 100, mode: 'normal', spaceId: 'space1', profileId: 'p1', tabIds: [1,2] };
    const group102s2: TabGroupData = { id: 102, mode: 'normal', spaceId: 'space2', profileId: 'p1', tabIds: [3] };

    setupMockData({
      tabs: [tab1s1, tab2s1, tab1s2],
      tabGroups: [group100s1, group102s2],
      activeTabIds: { 'space1': [1], 'space2': [3] }, // tab1s1 active in space1, tab1s2 active in space2
      focusedTabIds: { 'space1': [1], 'space2': [3] },
    });
    
    mockUseSpaces.currentSpace = { id: 'space1', profileId: 'profile1' }; // Set currentSpace for context

    let contextValue: any;
    await act(async () => {
      render(
        <TabsProvider>
          <TestConsumer onRender={(val) => contextValue = val} />
        </TabsProvider>
      );
    });

    // Test for currentSpace (space1)
    expect(contextValue.activeTabGroup).toBeDefined();
    expect(contextValue.activeTabGroup.id).toBe(100);
    expect(contextValue.activeTabGroup.tabs).toContain(tab1s1);
    expect(contextValue.focusedTab).toBe(tab1s1);

    // Test direct calls for space2
    const activeGroupS2 = contextValue.getActiveTabGroup('space2');
    const focusedTabS2 = contextValue.getFocusedTab('space2');
    expect(activeGroupS2).toBeDefined();
    expect(activeGroupS2.id).toBe(102);
    expect(activeGroupS2.tabs).toContain(tab1s2);
    expect(focusedTabS2).toBe(tab1s2);
  });

});

[end of src/renderer/src/components/providers/tabs-provider.test.tsx]
