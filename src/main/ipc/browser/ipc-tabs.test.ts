// src/main/ipc/browser/ipc-tabs.test.ts
import { getTabData, getTabGroupData } from './tabs'; // Assuming getWindowTabsData is also exported or tested via handlers
import { Tab } from '@/browser/tabs/tab';
import { BaseTabGroup, TabGroup } from '@/browser/tabs/tab-groups';
import { GlanceTabGroup } from '@/browser/tabs/tab-groups/glance';
import { TabbedBrowserWindow } from '@/browser/window';
import { browser } from '@/index'; // Mocked global
import { ipcMain, Menu } from 'electron';

// --- Mocks ---

// Mock Tab Class
jest.mock('@/browser/tabs/tab', () => ({
  Tab: jest.fn(), // Keep it simple, we'll create mock instances
}));

// Mock TabGroup Classes
jest.mock('@/browser/tabs/tab-groups', () => ({
  BaseTabGroup: jest.fn(), // For instanceof checks
}));
jest.mock('@/browser/tabs/tab-groups/glance', () => ({
  GlanceTabGroup: jest.fn(), // For instanceof checks
}));

// Mock global browser from @/index
jest.mock('@/index', () => ({
  browser: {
    tabs: { // Mock TabManager methods used by getWindowTabsData and handlers
      getTabsInWindow: jest.fn(),
      getTabGroupsInWindow: jest.fn(),
      getFocusedTab: jest.fn(),
      getActiveTab: jest.fn(),
      getTabById: jest.fn(), // For handlers like switch-to-tab, close-tab
      createTab: jest.fn(), // For new-tab handler
      disablePictureInPicture: jest.fn(), // For disable-pip handler
    },
    getWindowFromWebContents: jest.fn(),
    getWindowById: jest.fn(),
    // other browser properties/methods if needed
  },
}));

// Mock Electron IPC and Menu
jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
  },
  Menu: {
    buildFromTemplate: jest.fn(() => ({
      popup: jest.fn(),
      append: jest.fn(), // if Menu.append is used directly
    })),
    append: jest.fn(), // if static Menu.append is used
    popup: jest.fn(),
  },
  MenuItem: jest.fn(), // Constructor for MenuItem
  clipboard: { // Mock clipboard if context menu tests are detailed
    writeText: jest.fn(),
  },
}));


// --- Test Suite ---

describe('IPC Tabs Data Serialization', () => {
  describe('getTabData', () => {
    test('should correctly serialize a Tab instance to TabData, including groupId', () => {
      const mockTabInstance = {
        id: 1,
        uniqueId: 'uid1',
        createdAt: 1000,
        lastActiveAt: 2000,
        profileId: 'p1',
        spaceId: 's1',
        getWindow: jest.fn(() => ({ id: 101 } as unknown as TabbedBrowserWindow)),
        groupId: 50, // Key addition
        title: 'Test Tab',
        url: 'http://example.com',
        isLoading: false,
        audible: false,
        muted: false,
        fullScreen: false,
        isPictureInPicture: false,
        faviconURL: 'http://example.com/favicon.ico',
        asleep: false,
        navHistory: [{ title: 'Prev', url: 'http://example.com/prev' }],
        navHistoryIndex: 0,
      } as unknown as Tab; // Cast to Tab to satisfy function signature

      const tabData = getTabData(mockTabInstance);

      expect(tabData).toEqual({
        id: 1,
        uniqueId: 'uid1',
        createdAt: 1000,
        lastActiveAt: 2000,
        profileId: 'p1',
        spaceId: 's1',
        windowId: 101,
        groupId: 50, // Assert groupId is present
        title: 'Test Tab',
        url: 'http://example.com',
        isLoading: false,
        audible: false,
        muted: false,
        fullScreen: false,
        isPictureInPicture: false,
        faviconURL: 'http://example.com/favicon.ico',
        asleep: false,
        navHistory: [{ title: 'Prev', url: 'http://example.com/prev' }],
        navHistoryIndex: 0,
      });
    });
  });

  describe('getTabGroupData', () => {
    test('should correctly serialize a BaseTabGroup instance', () => {
      const mockTab1 = { id: 1 } as Tab;
      const mockTab2 = { id: 2 } as Tab;
      const mockGroupInstance = {
        id: 10,
        mode: 'normal',
        profileId: 'p1',
        spaceId: 's1',
        tabs: [mockTab1, mockTab2], // `tabs` getter returns array of Tab instances
      } as unknown as BaseTabGroup;

      const groupData = getTabGroupData(mockGroupInstance);

      expect(groupData).toEqual({
        id: 10,
        mode: 'normal',
        profileId: 'p1',
        spaceId: 's1',
        tabIds: [1, 2],
        glanceFrontTabId: undefined,
      });
    });

    test('should correctly serialize a GlanceTabGroup instance with glanceFrontTabId', () => {
      const mockTab1 = { id: 1 } as Tab;
      const mockTab2 = { id: 2 } as Tab;
      const mockGlanceGroupInstance = {
        id: 20,
        mode: 'glance',
        profileId: 'p2',
        spaceId: 's2',
        tabs: [mockTab1, mockTab2],
        frontTabId: 1, // Specific to GlanceTabGroup
      } as unknown as GlanceTabGroup; // Cast as it has extra prop

      const groupData = getTabGroupData(mockGlanceGroupInstance);

      expect(groupData).toEqual({
        id: 20,
        mode: 'glance',
        profileId: 'p2',
        spaceId: 's2',
        tabIds: [1, 2],
        glanceFrontTabId: 1,
      });
    });
  });

  // Test getWindowTabsData - this is implicitly tested by testing the IPC handler 'tabs:get-data'
  // but a direct test can be added if getWindowTabsData is exported and complex.
  // For now, we assume its core logic (calling getTabData and getTabGroupData) is covered.

  describe('IPC Handlers', () => {
    // Example for 'tabs:get-data'. Similar structure for other handlers if needed.
    describe('"tabs:get-data" handler', () => {
      let mockEvent: { sender: any };
      let mockWindow: jest.Mocked<TabbedBrowserWindow>;

      beforeEach(() => {
        mockEvent = { sender: {} }; // Mock sender WebContents
        mockWindow = {
          id: 1,
          // ... other necessary TabbedBrowserWindow properties
        } as unknown as jest.Mocked<TabbedBrowserWindow>;

        (browser.getWindowFromWebContents as jest.Mock).mockReturnValue(mockWindow);
        
        // Mock return values for TabManager methods
        const mockTab1ForHandler = { id: 1, groupId: 50, /* other TabData props */ } as unknown as Tab;
        const mockTab2ForHandler = { id: 2, groupId: 50, /* other TabData props */ } as unknown as Tab;
        const mockGroupForHandler = { id: 50, mode: 'normal', tabs: [mockTab1ForHandler, mockTab2ForHandler], /* other TabGroupData props */ } as unknown as BaseTabGroup;

        (browser.tabs.getTabsInWindow as jest.Mock).mockReturnValue([mockTab1ForHandler, mockTab2ForHandler]);
        (browser.tabs.getTabGroupsInWindow as jest.Mock).mockReturnValue([mockGroupForHandler]);
        (browser.tabs.getFocusedTab as jest.Mock).mockImplementation((winId, spaceId) => {
            if (winId === mockWindow.id && spaceId === (mockTab1ForHandler as any).spaceId) return mockTab1ForHandler;
            return undefined;
        });
        (browser.tabs.getActiveTab as jest.Mock).mockImplementation((winId, spaceId) => {
            if (winId === mockWindow.id && spaceId === (mockTab1ForHandler as any).spaceId) return mockGroupForHandler; // Example: group is active
            return undefined;
        });

        // Setup mock getWindow for Tab objects if getTabData relies on it.
        // The mock Tab instances should have getWindow() mocked.
        (mockTab1ForHandler as jest.Mocked<Tab>).getWindow = jest.fn().mockReturnValue(mockWindow);
        (mockTab2ForHandler as jest.Mocked<Tab>).getWindow = jest.fn().mockReturnValue(mockWindow);
      });

      test('should call getWindowTabsData and return its result', async () => {
        // Find the actual handler function registered with ipcMain.handle
        const handlerEntry = (ipcMain.handle as jest.Mock).mock.calls.find(
          (call) => call[0] === 'tabs:get-data'
        );
        expect(handlerEntry).toBeDefined();
        const handler = handlerEntry[1]; // The callback function

        const result = await handler(mockEvent);
        
        expect(browser.getWindowFromWebContents).toHaveBeenCalledWith(mockEvent.sender);
        expect(browser.tabs.getTabsInWindow).toHaveBeenCalledWith(mockWindow.id);
        expect(browser.tabs.getTabGroupsInWindow).toHaveBeenCalledWith(mockWindow.id);
        
        // Assert structure of result - primarily that it includes serialized tabs and groups
        expect(result).toHaveProperty('tabs');
        expect(result).toHaveProperty('tabGroups');
        expect(result.tabs).toHaveLength(2);
        expect(result.tabGroups).toHaveLength(1);
        expect(result.tabs[0]).toHaveProperty('groupId', 50); // Check if getTabData was called correctly
        expect(result.tabGroups[0]).toHaveProperty('id', 50);
      });

      test('should return null if no window is found', async () => {
        (browser.getWindowFromWebContents as jest.Mock).mockReturnValue(null);
        const handlerEntry = (ipcMain.handle as jest.Mock).mock.calls.find(call => call[0] === 'tabs:get-data');
        const handler = handlerEntry[1];
        const result = await handler(mockEvent);
        expect(result).toBeNull();
      });
    });
  });
});

[end of src/main/ipc/browser/ipc-tabs.test.ts]
