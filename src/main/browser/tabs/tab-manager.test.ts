// src/main/browser/tabs/tab-manager.test.ts
import { TabManager } from './tab-manager';
import { Tab } from './tab';
import { BaseTabGroup, TabGroup } from './tab-groups';
import { GlanceTabGroup } from './tab-groups/glance'; // Assuming GlanceTabGroup might be created
import { Browser } from '@/browser/browser';
import { TabbedBrowserWindow } from '@/browser/window';
import { LoadedProfile } from '@/browser/profile-manager';
import { Session } from 'electron'; // For Tab constructor if needed by mocks

// --- Mocks ---

// Mock Tab Class
jest.mock('./tab', () => {
  return {
    Tab: jest.fn().mockImplementation((details, options) => {
      const instance = {
        id: Math.floor(Math.random() * 100000),
        uniqueId: `mock-tab-${Math.random()}`,
        groupId: details.groupId || options.groupId, // Simplified groupId assignment
        profileId: details.profileId,
        spaceId: details.spaceId,
        windowId: options.window.id, // Mocked window needs an id
        getWindow: jest.fn().mockReturnValue(options.window),
        setWindow: jest.fn(),
        updateLayout: jest.fn(),
        destroy: jest.fn(),
        on: jest.fn((event, callback) => { // Basic event emitter mock
          if (!instance._listeners) instance._listeners = {};
          if (!instance._listeners[event]) instance._listeners[event] = [];
          instance._listeners[event].push(callback);
        }),
        emit: jest.fn((event, ...args) => {
            if (instance._listeners && instance._listeners[event]) {
                instance._listeners[event].forEach((cb: Function) => cb(...args));
            }
        }),
        isDestroyed: false, // Mock property
        // Add other properties/methods if TabManager interacts with them
        loadedProfile: details.loadedProfile,
        webContents: { // Mock webContents if TabManager or others access it via Tab
            focus: jest.fn(),
        },
      };
      // Simulate 'destroyed' event emission when destroy is called
      instance.destroy = jest.fn(() => {
        instance.isDestroyed = true;
        instance.emit('destroyed');
      });
      return instance;
    }),
  };
});

// Mock BaseTabGroup and GlanceTabGroup
let mockBaseTabGroupTabs: Tab[] = [];
const mockBaseTabGroupInstances: jest.Mocked<BaseTabGroup>[] = [];
jest.mock('./tab-groups', () => {
  const originalModule = jest.requireActual('./tab-groups');
  return {
    ...originalModule, // Preserve other exports like TabGroup type if needed
    BaseTabGroup: jest.fn().mockImplementation((browser, tabManager, id, initialTabs) => {
      const instance = {
        id,
        mode: 'normal',
        profileId: initialTabs[0].profileId,
        spaceId: initialTabs[0].spaceId,
        windowId: initialTabs[0].getWindow().id,
        tabs: [...initialTabs] as Tab[], // Store tabs
        tabIds: initialTabs.map((t: Tab) => t.id),
        isDestroyed: false,
        addTab: jest.fn((tabId) => {
            const tab = tabManager.getTabById(tabId);
            if (tab && !instance.tabs.find(t => t.id === tabId)) {
                instance.tabs.push(tab);
                instance.tabIds.push(tabId);
                tab.groupId = instance.id; // Simulate group assignment
                instance.emit('tab-added', tabId);
                return true;
            }
            return false;
        }),
        removeTab: jest.fn((tabId) => {
          instance.tabs = instance.tabs.filter((t: Tab) => t.id !== tabId);
          instance.tabIds = instance.tabIds.filter((id: number) => id !== tabId);
          // Don't nullify tab.groupId here, TabManager handles re-assignment
          instance.emit('tab-removed', tabId);
          return true;
        }),
        destroy: jest.fn(() => {
          instance.isDestroyed = true;
          instance.emit('destroy'); // Emit destroy event
          // Real BaseTabGroup would clear its tabs list here or before emitting.
          // For test purposes, internalDestroyTabGroup will receive tabsThatWereInGroup.
        }),
        on: jest.fn((event, callback) => {
            if (!instance._listeners) instance._listeners = {};
            if (!instance._listeners[event]) instance._listeners[event] = [];
            instance._listeners[event].push(callback);
        }),
        emit: jest.fn((event, ...args) => {
            if (instance._listeners && instance._listeners[event]) {
                instance._listeners[event].forEach((cb: Function) => cb(...args));
            }
        }),
        _listeners: {},
      } as unknown as jest.Mocked<BaseTabGroup>;
      mockBaseTabGroupInstances.push(instance);
      mockBaseTabGroupTabs = instance.tabs; // Keep track of tabs for assertion
      return instance;
    }),
  };
});

jest.mock('./tab-groups/glance', () => {
    return {
        GlanceTabGroup: jest.fn().mockImplementation((browser, tabManager, id, initialTabs) => {
            const baseGroupInstance = new (require('./tab-groups').BaseTabGroup)(browser, tabManager, id, initialTabs);
            baseGroupInstance.mode = 'glance';
            // Add any GlanceTabGroup specific mocks if needed
            (baseGroupInstance as any).frontTabId = initialTabs[0]?.id; // Example property
            (baseGroupInstance as any).setFrontTab = jest.fn();
            return baseGroupInstance;
        })
    };
});


// Mock Browser and its dependencies
jest.mock('@/browser/browser');
jest.mock('@/browser/window', () => ({
  TabbedBrowserWindow: jest.fn().mockImplementation(() => ({
    id: 1, // Default window ID
    coreWebContents: [], // For windowTabsChanged
    getPageBounds: jest.fn().mockReturnValue({ x: 0, y: 0, width: 800, height: 600 }),
    // Add other necessary mocks if TabManager interacts more deeply
  })),
}));
jest.mock('@/browser/profile-manager', () => ({
  LoadedProfile: jest.fn().mockImplementation(() => ({
    session: {} as Session, // Mock session object
    newTabUrl: 'flow://new-tab',
    extensions: { addTab: jest.fn(), selectTab: jest.fn(), tabUpdated: jest.fn() },
  })),
}));

// Mock IPC (simplified)
jest.mock('@/ipc/browser/tabs', () => ({
  windowTabsChanged: jest.fn(),
}));


// --- Test Suite ---

describe('TabManager', () => {
  let tabManager: TabManager;
  let mockBrowser: jest.Mocked<Browser>;
  let mockWindow: jest.Mocked<TabbedBrowserWindow>;
  let mockProfile: jest.Mocked<LoadedProfile>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockBaseTabGroupInstances.length = 0; // Clear tracked instances

    mockBrowser = new (Browser as any)() as jest.Mocked<Browser>;
    // @ts-ignore TabManager constructor expects Browser, but we mock its methods
    tabManager = new TabManager(mockBrowser);

    // Mock getWindowById and getLoadedProfile on browser instance
    mockWindow = new (TabbedBrowserWindow as any)() as jest.Mocked<TabbedBrowserWindow>;
    mockWindow.id = 1; // Ensure window has an ID for tests
    mockProfile = new (LoadedProfile as any)() as jest.Mocked<LoadedProfile>;
    
    (mockBrowser.getWindowById as jest.Mock).mockReturnValue(mockWindow);
    (mockBrowser.getLoadedProfile as jest.Mock).mockReturnValue(mockProfile);
    (mockBrowser.tabs as any) = tabManager; // Circular reference for some internal calls if any

  });

  describe('internalCreateTab', () => {
    test('should create a new Tab with a new default BaseTabGroup if no groupId is provided', () => {
      const tab = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1');
      
      expect(Tab).toHaveBeenCalledTimes(1);
      expect(tab.groupId).toBeDefined();
      expect(typeof tab.groupId).toBe('number');

      expect(BaseTabGroup).toHaveBeenCalledTimes(1);
      const groupInstance = mockBaseTabGroupInstances[0];
      expect(groupInstance.id).toBe(tab.groupId);
      expect(groupInstance.tabs).toContain(tab);
      expect(tabManager.tabGroups.get(tab.groupId)).toBe(groupInstance);

      // Check if the group's destroy listener is set up
      // This is a bit tricky to test without inspecting private properties or specific event setup.
      // We can infer it by testing destroyTabGroup later and ensuring tabs are reassigned.
    });

    test('should use provided groupId and not create a new default group if groupId is in options', () => {
        const existingGroupId = 500;
        // Assume group 500 already exists or is managed elsewhere for this specific call context
        // For this test, we just check that TabManager doesn't create a *new* default group.
        const tab = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1', undefined, { groupId: existingGroupId });

        expect(Tab).toHaveBeenCalledTimes(1);
        expect(tab.groupId).toBe(existingGroupId);
        
        // BaseTabGroup should NOT have been called by internalCreateTab to make a NEW default group
        // because a groupId was provided.
        const newDefaultGroupInstance = mockBaseTabGroupInstances.find(g => g.id !== existingGroupId);
        expect(newDefaultGroupInstance).toBeUndefined();
        
        // TabManager should not have added a NEW group for this tab.
        // If group 500 was meant to be created, it's outside this specific internalCreateTab path for default groups.
        expect(tabManager.tabGroups.get(existingGroupId)).toBeUndefined(); // or to an existing mock if we pre-added it
    });
  });

  describe('createTabGroup (e.g., glance)', () => {
    test('should move tabs to the new group and destroy empty old default groups', () => {
      const tab1 = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1'); // Gets default group G1
      const tab2 = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1'); // Gets default group G2
      
      const oldGroup1Id = tab1.groupId;
      const oldGroup1 = tabManager.getTabGroupById(oldGroup1Id) as jest.Mocked<BaseTabGroup>;
      expect(oldGroup1).toBeDefined();
      expect(oldGroup1?.tabs).toContain(tab1);

      // Create a new glance group with tab1 and tab2
      const glanceGroup = tabManager.createTabGroup('glance', [tab1.id, tab2.id]) as jest.Mocked<GlanceTabGroup>;
      expect(GlanceTabGroup).toHaveBeenCalledTimes(1);
      expect(glanceGroup.mode).toBe('glance');
      expect(tabManager.tabGroups.get(glanceGroup.id)).toBe(glanceGroup);

      expect(tab1.groupId).toBe(glanceGroup.id);
      expect(tab2.groupId).toBe(glanceGroup.id);
      expect(glanceGroup.tabs).toContain(tab1);
      expect(glanceGroup.tabs).toContain(tab2);

      // Old default group for tab1 should have been destroyed
      expect(oldGroup1.removeTab).toHaveBeenCalledWith(tab1.id);
      expect(oldGroup1.destroy).toHaveBeenCalledTimes(1); // Because it became empty
      expect(tabManager.tabGroups.has(oldGroup1Id)).toBe(false);

      // (Similar checks for tab2's original default group if it was different and became empty)
      const oldGroup2Id = mockBaseTabGroupInstances.find(g => g.tabs.includes(tab2) && g.id !== glanceGroup.id)?.id;
      if (oldGroup2Id && oldGroup2Id !== oldGroup1Id) {
        const oldGroup2 = tabManager.getTabGroupById(oldGroup2Id) as jest.Mocked<BaseTabGroup> | undefined;
        // This check is tricky because oldGroup2 might already be removed from tabManager.tabGroups
        // The core idea is that if it existed and became empty, it was destroyed.
        // The mock for BaseTabGroup.destroy() is called when its .tabs becomes empty via removeTab.
      }
    });
  });

  describe('removeTab (on tab destruction)', () => {
    test('should remove tab from its group and destroy group if it becomes empty', () => {
      const tab1 = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1'); // Default group G1
      const tab2 = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1'); // Default group G2
      
      // Create a group with tab1 and tab2
      const userGroup = tabManager.createTabGroup('normal', [tab1.id, tab2.id]) as jest.Mocked<BaseTabGroup>;
      const userGroupId = userGroup.id;

      // Simulate tab1 being destroyed
      // Tab.destroy() -> emits 'destroyed' -> TabManager.removeTab(tab1)
      (tabManager.getTabById(tab1.id) as jest.Mocked<Tab>).emit('destroyed');
      
      expect(userGroup.removeTab).toHaveBeenCalledWith(tab1.id);
      expect(userGroup.destroy).not.toHaveBeenCalled(); // Group still has tab2
      expect(tabManager.tabGroups.has(userGroupId)).toBe(true);

      // Simulate tab2 being destroyed
      (tabManager.getTabById(tab2.id) as jest.Mocked<Tab>).emit('destroyed');

      expect(userGroup.removeTab).toHaveBeenCalledWith(tab2.id);
      expect(userGroup.destroy).toHaveBeenCalledTimes(1); // Group is now empty
      expect(tabManager.tabGroups.has(userGroupId)).toBe(false);
    });
  });
  
  describe('destroyTabGroup / internalDestroyTabGroup', () => {
    test('should reassign tabs to new default groups when a group is destroyed', () => {
      const tab1 = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1');
      const tab2 = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1');
      const userGroup = tabManager.createTabGroup('normal', [tab1.id, tab2.id]) as jest.Mocked<BaseTabGroup>;
      const userGroupId = userGroup.id;

      // Store original tabs for checking reassignment
      const tabsThatWereInGroup = [...userGroup.tabs];
      
      // Spy on BaseTabGroup constructor calls after this point for new default groups
      const baseTabGroupSpy = jest.spyOn(require('./tab-groups'), 'BaseTabGroup');

      // Destroy the group
      tabManager.destroyTabGroup(userGroupId);

      expect(userGroup.destroy).toHaveBeenCalledTimes(1);
      expect(tabManager.tabGroups.has(userGroupId)).toBe(false);

      // Check tab1
      const tab1Instance = tabManager.getTabById(tab1.id) as jest.Mocked<Tab>;
      expect(tab1Instance.groupId).not.toBe(userGroupId); // Should have a new groupId
      const newGroupForTab1 = tabManager.getTabGroupById(tab1Instance.groupId) as jest.Mocked<BaseTabGroup>;
      expect(newGroupForTab1).toBeDefined();
      expect(newGroupForTab1.tabs).toContain(tab1Instance);
      expect(newGroupForTab1.id).toBe(tab1Instance.groupId);

      // Check tab2
      const tab2Instance = tabManager.getTabById(tab2.id) as jest.Mocked<Tab>;
      expect(tab2Instance.groupId).not.toBe(userGroupId); // Should have a new groupId
      const newGroupForTab2 = tabManager.getTabGroupById(tab2Instance.groupId) as jest.Mocked<BaseTabGroup>;
      expect(newGroupForTab2).toBeDefined();
      expect(newGroupForTab2.tabs).toContain(tab2Instance);
      expect(newGroupForTab2.id).toBe(tab2Instance.groupId);
      
      expect(tab1Instance.groupId).not.toBe(tab2Instance.groupId); // Each should get its own new default group

      // Ensure BaseTabGroup constructor was called for these new default groups
      // It's called once for userGroup, then once for each tab's new default group.
      // The mock setup for BaseTabGroup makes exact call count tricky without more refined spy.
      // The key is that new groups exist and contain the tabs.
      expect(baseTabGroupSpy).toHaveBeenCalledTimes(1 + tabsThatWereInGroup.length + 2); // 2 for initial default groups, 1 for userGroup, 2 for new default groups
      
      baseTabGroupSpy.mockRestore();
    });
  });

  describe('getTabGroupByTabId', () => {
    test('should always return a TabGroup instance for a valid tab', () => {
      const tab = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1');
      const group = tabManager.getTabGroupByTabId(tab.id);
      expect(group).toBeDefined();
      expect(group?.id).toBe(tab.groupId);
      expect(group?.tabs).toContain(tab);
    });

    test('should return undefined for a non-existent tab (or log error if tab exists but group doesn\'t)', () => {
        // Case 1: Tab doesn't exist
        expect(tabManager.getTabGroupByTabId(99999)).toBeUndefined();

        // Case 2: Tab exists but its groupId doesn't map to a group (error state)
        const tab = tabManager.internalCreateTab(mockWindow.id, 'prof1', 'space1');
        const originalGroupId = tab.groupId;
        tabManager.tabGroups.delete(originalGroupId); // Manually create inconsistent state
        
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        expect(tabManager.getTabGroupByTabId(tab.id)).toBeUndefined();
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining(`Tab ${tab.id} (uniqueId: ${tab.uniqueId}) has groupId ${originalGroupId}, but no such group exists`));
        consoleErrorSpy.mockRestore();
    });
  });
});

[end of src/main/browser/tabs/tab-manager.test.ts]
