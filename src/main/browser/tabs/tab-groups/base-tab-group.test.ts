// src/main/browser/tabs/tab-groups/base-tab-group.test.ts
import { BaseTabGroup } from './index'; // Assuming index.ts exports BaseTabGroup
import { Tab } from '../tab';
import { TabManager } from '../tab-manager';
import { Browser } from '@/browser/browser';
import { TabbedBrowserWindow } from '@/browser/window';

// --- Mocks ---

// Mock Tab Class
// Keep track of mock tab instances to inspect them
const mockTabInstances: jest.Mocked<Tab>[] = [];

jest.mock('../tab', () => {
  return {
    Tab: jest.fn().mockImplementation((details, options) => {
      const instance = {
        id: details.id || Math.floor(Math.random() * 100000),
        uniqueId: `mock-tab-${Math.random()}`,
        groupId: details.groupId, // Will be updated by BaseTabGroup
        profileId: details.profileId || 'mock-profile',
        spaceId: details.spaceId || 'mock-space',
        // windowId: options?.window?.id,
        getWindow: jest.fn().mockReturnValue(options?.window || { id: 1, /* other mock window props */ }),
        setWindow: jest.fn(),
        setSpace: jest.fn(),
        updateLayout: jest.fn(),
        destroy: jest.fn(),
        on: jest.fn(), // Simplified event handling for this mock
        emit: jest.fn(),
        connect: jest.fn().mockReturnValue(jest.fn()), // For event listener disconnection
        isDestroyed: false,
        // Add other properties/methods if BaseTabGroup interacts with them
      } as unknown as jest.Mocked<Tab>;
      mockTabInstances.push(instance);
      return instance;
    }),
  };
});


// Mock TabManager
let mockTabsInManager: Map<number, jest.Mocked<Tab>>;
const mockTabManagerInstance = {
  getTabById: jest.fn((tabId: number) => mockTabsInManager.get(tabId)),
  // Add other TabManager methods if BaseTabGroup calls them
  // For example, if BaseTabGroup calls setActiveTab on TabManager
  setActiveTab: jest.fn(),
  connect: jest.fn().mockReturnValue(jest.fn()), // For 'active-tab-changed' listener
} as unknown as jest.Mocked<TabManager>;

jest.mock('../tab-manager', () => {
  return {
    TabManager: jest.fn(() => mockTabManagerInstance),
  };
});

// Mock Browser and TabbedBrowserWindow
const mockBrowserInstance = {
  getWindowById: jest.fn(),
} as unknown as jest.Mocked<Browser>;
const mockWindowInstance = {
  id: 1,
  // Add other properties if needed
} as unknown as jest.Mocked<TabbedBrowserWindow>;

jest.mock('@/browser/browser', () => ({
  Browser: jest.fn(() => mockBrowserInstance),
}));
jest.mock('@/browser/window', () => ({
  TabbedBrowserWindow: jest.fn(() => mockWindowInstance),
}));


// --- Test Suite ---

describe('BaseTabGroup', () => {
  let tab1: jest.Mocked<Tab>, tab2: jest.Mocked<Tab>, tab3: jest.Mocked<Tab>;
  let group: BaseTabGroup;
  const initialGroupId = 100; // Group ID for tabs before being added to this group

  beforeEach(() => {
    jest.clearAllMocks();
    mockTabInstances.length = 0; // Clear previous tab instances
    mockTabsInManager = new Map();

    // Create mock tabs
    // @ts-ignore
    tab1 = new (Tab as any)({ id: 1, groupId: initialGroupId, profileId: 'p1', spaceId: 's1' }, { window: mockWindowInstance }) as jest.Mocked<Tab>;
    // @ts-ignore
    tab2 = new (Tab as any)({ id: 2, groupId: initialGroupId, profileId: 'p1', spaceId: 's1' }, { window: mockWindowInstance }) as jest.Mocked<Tab>;
    // @ts-ignore
    tab3 = new (Tab as any)({ id: 3, groupId: initialGroupId, profileId: 'p1', spaceId: 's1' }, { window: mockWindowInstance }) as jest.Mocked<Tab>;
    
    mockTabsInManager.set(tab1.id, tab1);
    mockTabsInManager.set(tab2.id, tab2);
    mockTabsInManager.set(tab3.id, tab3);
    
    (mockBrowserInstance.getWindowById as jest.Mock).mockReturnValue(mockWindowInstance);

    // Create group instance for testing
    group = new BaseTabGroup(mockBrowserInstance, mockTabManagerInstance, 200, [tab1, tab2]);
  });

  describe('constructor', () => {
    test('should initialize properties correctly and add initial tabs', () => {
      expect(group.id).toBe(200);
      expect(group.windowId).toBe(mockWindowInstance.id);
      expect(group.profileId).toBe('p1');
      expect(group.spaceId).toBe('s1');
      expect(group.tabs).toEqual(expect.arrayContaining([tab1, tab2]));
      expect(group.tabIds).toEqual(expect.arrayContaining([tab1.id, tab2.id]));

      expect(tab1.groupId).toBe(group.id); // groupId should be updated
      expect(tab2.groupId).toBe(group.id);

      expect(tab1.setSpace).toHaveBeenCalledWith(group.spaceId);
      expect(tab1.setWindow).toHaveBeenCalledWith(mockWindowInstance);
      expect(tab2.setSpace).toHaveBeenCalledWith(group.spaceId);
      expect(tab2.setWindow).toHaveBeenCalledWith(mockWindowInstance);
    });
  });

  describe('addTab', () => {
    test('should add a tab successfully and update its groupId', () => {
      expect(group.hasTab(tab3.id)).toBe(false);
      const result = group.addTab(tab3.id);

      expect(result).toBe(true);
      expect(group.tabs).toContain(tab3);
      expect(group.tabIds).toContain(tab3.id);
      expect(tab3.groupId).toBe(group.id);
      expect(tab3.setSpace).toHaveBeenCalledWith(group.spaceId);
      expect(tab3.setWindow).toHaveBeenCalledWith(mockWindowInstance);
      expect(group.emit).toHaveBeenCalledWith('tab-added', tab3.id);
    });

    test('should return false if tab is already in the group', () => {
      const result = group.addTab(tab1.id);
      expect(result).toBe(false);
    });

    test('should return false if tab is not found by TabManager', () => {
      (mockTabManagerInstance.getTabById as jest.Mock).mockReturnValueOnce(undefined);
      const result = group.addTab(999);
      expect(result).toBe(false);
    });

    test('should set up event listeners on added tab', () => {
        group.addTab(tab3.id);
        expect(tab3.connect).toHaveBeenCalledWith('destroyed', expect.any(Function));
        expect(tab3.connect).toHaveBeenCalledWith('space-changed', expect.any(Function));
        expect(tab3.connect).toHaveBeenCalledWith('window-changed', expect.any(Function));
        // Check own listeners as well
        expect(group.connect).toHaveBeenCalledWith('tab-removed', expect.any(Function));
        expect(mockTabManagerInstance.connect).toHaveBeenCalledWith('active-tab-changed', expect.any(Function));
        expect(group.connect).toHaveBeenCalledWith('destroy', expect.any(Function));
    });
  });

  describe('removeTab', () => {
    beforeEach(() => {
      // Ensure tab1 has its groupId set to the group's id for this test block
      tab1.groupId = group.id;
    });

    test('should remove a tab successfully but NOT change its groupId', () => {
      const originalGroupId = tab1.groupId;
      expect(group.hasTab(tab1.id)).toBe(true);
      const result = group.removeTab(tab1.id);

      expect(result).toBe(true);
      expect(group.tabs).not.toContain(tab1);
      expect(group.tabIds).not.toContain(tab1.id);
      expect(tab1.groupId).toBe(originalGroupId); // Crucial: BaseTabGroup does not change it
      expect(group.emit).toHaveBeenCalledWith('tab-removed', tab1.id);
    });

    test('should return false if tab is not in the group', () => {
      const result = group.removeTab(tab3.id); // tab3 was not added in this specific test's scope yet
      expect(result).toBe(false);
    });

    // Testing event listener disconnection is complex without more control or spies on the disconnect functions.
    // It's often an integration-level concern or tested by observing behavior (e.g., tab destroyed event no longer calls removeTab on the group).
  });

  describe('destroy', () => {
    test('should set isDestroyed, emit destroy event, and NOT change tab groupIds', () => {
      const tab1OriginalGroupId = tab1.groupId; // Should be group.id
      const tab2OriginalGroupId = tab2.groupId; // Should be group.id
      
      const destroyEmitterSpy = jest.spyOn(group, 'destroyEmitter');

      group.destroy();

      expect(group.isDestroyed).toBe(true);
      expect(group.emit).toHaveBeenCalledWith('destroy');
      expect(tab1.groupId).toBe(tab1OriginalGroupId); // Crucial
      expect(tab2.groupId).toBe(tab2OriginalGroupId); // Crucial
      expect(destroyEmitterSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('setSpace', () => {
    test('should update group spaceId and call setSpace on all member tabs', () => {
      const newSpaceId = 's2';
      group.setSpace(newSpaceId);

      expect(group.spaceId).toBe(newSpaceId);
      expect(tab1.setSpace).toHaveBeenCalledWith(newSpaceId);
      expect(tab2.setSpace).toHaveBeenCalledWith(newSpaceId);
      expect(group.emit).toHaveBeenCalledWith('space-changed');
    });
  });

  describe('setWindow', () => {
    test('should update group windowId and call setWindow on all member tabs', () => {
      const newMockWindow = { id: 2 } as unknown as jest.Mocked<TabbedBrowserWindow>;
      (mockBrowserInstance.getWindowById as jest.Mock).mockReturnValue(newMockWindow);
      
      group.setWindow(2);

      expect(group.windowId).toBe(2);
      expect(tab1.setWindow).toHaveBeenCalledWith(newMockWindow);
      expect(tab2.setWindow).toHaveBeenCalledWith(newMockWindow);
      expect(group.emit).toHaveBeenCalledWith('window-changed');
    });
  });

  describe('syncTab', () => {
    test('should call setSpace and setWindow on the tab', () => {
        const mockWindowForSync = { id: group.windowId } as jest.Mocked<TabbedBrowserWindow>;
        (mockBrowserInstance.getWindowById as jest.Mock).mockReturnValue(mockWindowForSync);

        group.syncTab(tab1);
        expect(tab1.setSpace).toHaveBeenCalledWith(group.spaceId);
        expect(tab1.setWindow).toHaveBeenCalledWith(mockWindowForSync);
    });
  });
});

[end of src/main/browser/tabs/tab-groups/base-tab-group.test.ts]
