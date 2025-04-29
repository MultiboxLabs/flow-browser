/**
 * @fileoverview Converts Chrome extension manifest permissions into user-facing
 * warning messages, based on Chromium's permission rule logic and messages.
 *
 * Derived from Chromium source:
 * - Rules logic: chrome/common/extensions/permissions/chrome_permission_message_rules.cc
 * - Message strings: chrome/app/generated_resources.grd (partial snippet)
 *
 * Limitations:
 * - Does not replicate dynamic formatting (HostListFormatter, etc.). Uses static messages.
 * - Assumes a default environment (e.g., not ChromeOS Flex 'reven', non-Windows) for conditional messages.
 * - Permission mapping from C++ APIPermissionID to manifest strings is best-effort.
 * - Does not replace <ph> placeholders in messages.
 * - Relies on the provided .grd snippet; messages not included will use their ID as text.
 */

const permissionMessages: Record<string, string> = {
  // From the provided .grd snippet (and some assumed common ones)
  IDS_EXTENSION_PROMPT_WARNING_DEBUGGER: "Debug extensions and pages", // Assumed common message
  IDS_EXTENSION_PROMPT_WARNING_FULL_ACCESS: "Read and change all your data on all websites", // Assumed common message
  IDS_EXTENSION_PROMPT_WARNING_ALL_HOSTS: "Read and change all your data on all websites", // Assumed common message
  IDS_EXTENSION_PROMPT_WARNING_ALL_HOSTS_READ_ONLY: "Read all your data on all websites", // Assumed common message
  // --- Start of messages from the provided GRD snippet ---
  IDS_EXTENSION_PROMPT_WARNING_CERTIFICATEPROVIDER: "Provide certificates for authentication",
  IDS_EXTENSION_PROMPT_WARNING_SETTINGS_PRIVATE: "Read and change user and device settings",
  IDS_EXTENSION_PROMPT_WARNING_AUTOFILL_PRIVATE: "Read and change autofill settings",
  IDS_EXTENSION_PROMPT_WARNING_PASSWORDS_PRIVATE: "Read and change saved password settings",
  IDS_EXTENSION_PROMPT_WARNING_USERS_PRIVATE: "Read and change allowlisted users",
  IDS_EXTENSION_PROMPT_WARNING_NEW_TAB_PAGE_OVERRIDE: "Replace the page you see when opening a new tab",
  IDS_EXTENSION_PROMPT_WARNING_TRANSIENT_BACKGROUND:
    "Run in the background when requested by a cooperating native application",
  IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_DEVICE_ATTRIBUTES:
    "See device information, such as its serial number or asset ID",
  IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_KIOSK_INPUT: "Change the system keyboard layout",
  IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_NETWORKING_ATTRIBUTES:
    "See network information, such as your IP or MAC address",
  IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_PLATFORMKEYS:
    "Perform security-related tasks for your organization, such as managing certificates and keys stored on the device",
  // Using default 'IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_REPORTING_PRIVATE' for GetEnterpriseReportingPrivatePermissionMessageId()
  IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_REPORTING_PRIVATE: "Read information about your browser, OS, and device",
  IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_REMOTE_APPS: "Add remote apps to the ChromeOS launcher",
  // Using 'not reven' messages for ChromeOS telemetry/diagnostics
  IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_ATTACHED_DEVICE_INFO: "Read attached devices information and data",
  IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_BLUETOOTH_PERIPHERALS_INFO: "Read Bluetooth peripherals information and data",
  IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_DIAGNOSTICS: "Run ChromeOS diagnostic tests",
  IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_DIAGNOSTICS_NETWORK_INFO_FOR_MLAB:
    "Collect IP address and network measurement results for Measurement Lab, according to their privacy policy (measurementlab.net/privacy)",
  IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_EVENTS: "Subscribe to ChromeOS system events",
  IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_MANAGEMENT_AUDIO: "Manage ChromeOS audio settings",
  IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_TELEMETRY: "Read ChromeOS device information and data",
  IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_TELEMETRY_SERIAL_NUMBER: "Read ChromeOS device and component serial numbers",
  IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_TELEMETRY_NETWORK_INFORMATION: "Read ChromeOS network information",
  IDS_EXTENSION_PROMPT_WARNING_OMNIBOX_DIRECT_INPUT: "Read and save keyboard input from the address bar",
  // --- End of messages from the provided GRD snippet ---

  // --- Manually added common messages (based on C++ but missing from snippet) ---
  IDS_EXTENSION_PROMPT_WARNING_HISTORY: "Read and change your Browse history", // Simplified assumption for history
  IDS_EXTENSION_PROMPT_WARNING_HISTORY_WRITE_ON_ALL_DEVICES:
    "Read and change your Browse history on all your signed-in devices",
  IDS_EXTENSION_PROMPT_WARNING_HISTORY_READ_ON_ALL_DEVICES: "Read your Browse history on all your signed-in devices",
  IDS_EXTENSION_PROMPT_WARNING_HISTORY_READ: "Read your Browse history",
  IDS_EXTENSION_PROMPT_WARNING_TABS: "Read your Browse history", // 'tabs' often implies history access warning
  IDS_EXTENSION_PROMPT_WARNING_SESSIONS: "Access recently closed tabs", // Often combined with 'tabs' for history warning
  IDS_EXTENSION_PROMPT_WARNING_BOOKMARKS: "Read and change your bookmarks",
  IDS_EXTENSION_PROMPT_WARNING_READING_LIST: "Read and change your reading list",
  IDS_EXTENSION_PROMPT_WARNING_DOWNLOADS: "Manage your downloads",
  IDS_EXTENSION_PROMPT_WARNING_DOWNLOADS_OPEN: "Open files that you have downloaded",
  IDS_EXTENSION_PROMPT_WARNING_MANAGEMENT: "Manage your apps, extensions, and themes",
  IDS_EXTENSION_PROMPT_WARNING_GEOLOCATION: "Detect your physical location",
  IDS_EXTENSION_PROMPT_WARNING_NOTIFICATIONS: "Display notifications",
  IDS_EXTENSION_PROMPT_WARNING_CLIPBOARD_READWRITE: "Read and modify data you copy and paste",
  IDS_EXTENSION_PROMPT_WARNING_CLIPBOARD: "Read data you copy and paste", // Assuming this means read-only
  IDS_EXTENSION_PROMPT_WARNING_CLIPBOARD_WRITE: "Modify data you copy and paste",
  IDS_EXTENSION_PROMPT_WARNING_DECLARATIVE_WEB_REQUEST: "Block parts of web pages", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_DECLARATIVE_NET_REQUEST: "Block network requests", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_PROXY: "Read and modify proxy settings", // Common permission
  IDS_EXTENSION_PROMPT_WARNING_NATIVE_MESSAGING: "Communicate with cooperating native applications",
  IDS_EXTENSION_PROMPT_WARNING_VPN: "Manage VPN connections",
  IDS_EXTENSION_PROMPT_WARNING_IDENTITY_EMAIL: "Know your email address",
  IDS_EXTENSION_PROMPT_WARNING_AUDIO_CAPTURE: "Capture audio",
  IDS_EXTENSION_PROMPT_WARNING_VIDEO_CAPTURE: "Capture video",
  IDS_EXTENSION_PROMPT_WARNING_AUDIO_AND_VIDEO_CAPTURE: "Capture audio and video",
  IDS_EXTENSION_PROMPT_WARNING_DESKTOP_CAPTURE: "Capture content of your screen",
  IDS_EXTENSION_PROMPT_WARNING_USB_DEVICES: "Access USB devices", // Simplified USB message
  IDS_EXTENSION_PROMPT_WARNING_BLUETOOTH: "Access Bluetooth devices", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_SERIAL: "Access serial devices", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_BLUETOOTH_SERIAL: "Access Bluetooth and serial devices", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_U2F_DEVICES: "Access U2F security keys",
  IDS_EXTENSION_PROMPT_WARNING_FILE_SYSTEM_WRITE_DIRECTORY: "Modify files and folders you select", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_FILE_SYSTEM_DIRECTORY: "Read files and folders you select", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_NETWORK_STATE: "Monitor network status",
  IDS_EXTENSION_PROMPT_WARNING_PRIVACY: "Change privacy-related settings",
  IDS_EXTENSION_PROMPT_WARNING_INPUT: "Monitor keyboard input", // Simplified IME message
  IDS_EXTENSION_PROMPT_WARNING_TTS_ENGINE: "Provide text-to-speech services",
  IDS_EXTENSION_PROMPT_WARNING_WALLPAPER: "Change your wallpaper",
  IDS_EXTENSION_PROMPT_WARNING_ACCESSIBILITY_FEATURES_READ_MODIFY: "Read and change accessibility features",
  IDS_EXTENSION_PROMPT_WARNING_ACCESSIBILITY_FEATURES_MODIFY: "Change accessibility features",
  IDS_EXTENSION_PROMPT_WARNING_ACCESSIBILITY_FEATURES_READ: "Read accessibility features",
  IDS_EXTENSION_PROMPT_WARNING_CONTENT_SETTINGS:
    "Change settings that control websites' access to features such as cookies, JavaScript, plugins, geolocation, microphone, camera etc.",
  IDS_EXTENSION_PROMPT_WARNING_SYSTEM_STORAGE: "Identify and eject storage devices",
  IDS_EXTENSION_PROMPT_WARNING_SYNCFILESYSTEM: "Store data in your Google Drive",
  IDS_EXTENSION_PROMPT_WARNING_TAB_GROUPS: "Organize your tabs into groups",
  IDS_EXTENSION_PROMPT_WARNING_PLATFORMKEYS: "Access platform keys", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_LOGIN: "Perform sign-in related operations", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_LOGIN_SCREEN_UI: "Interact with the login screen UI", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_LOGIN_SCREEN_STORAGE: "Access storage on the login screen", // Simplified

  // Placeholders for Formatter-based messages (from C++)
  IDS_EXTENSION_PROMPT_WARNING_HOST_LIST_FORMATTER: "Access your data on specific sites", // Generic placeholder
  IDS_EXTENSION_PROMPT_WARNING_HOST_LIST_FORMATTER_READ_ONLY: "Read your data on specific sites", // Generic placeholder
  IDS_EXTENSION_PROMPT_WARNING_SOCKET_ANY_HOST: "Exchange data with any device on the local network or internet", // Generic placeholder
  IDS_EXTENSION_PROMPT_WARNING_SOCKET_HOSTS_FORMATTER:
    "Exchange data with specific devices on the local network or internet", // Generic placeholder
  IDS_EXTENSION_PROMPT_WARNING_USB_DEVICE_FORMATTER: "Access specific USB devices", // Generic placeholder
  IDS_EXTENSION_PROMPT_WARNING_MEDIA_GALLERIES_READ_WRITE_DELETE:
    "Access, change, or delete your photos, videos, and music", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_MEDIA_GALLERIES_READ_WRITE: "Access and change your photos, videos, and music", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_MEDIA_GALLERIES_READ_DELETE: "Access or delete your photos, videos, and music", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_MEDIA_GALLERIES_READ: "Access your photos, videos, and music", // Simplified
  IDS_EXTENSION_PROMPT_WARNING_SETTINGS_OVERRIDE_FORMATTER: "Change your search settings / homepage / startup pages", // Generic placeholder

  // --- Fallback for missing messages ---
  DEFAULT: "Perform an unknown operation"
};

/**
 * Maps C++ APIPermissionID constants (inferred from names) to manifest.json permission strings.
 * This is a best-effort mapping based on common permissions and C++ identifier names.
 * Note: <all_urls> covers kHostsAll, kHostsAllReadOnly, kHostReadWrite, kHostReadOnly for simplicity here.
 * Specific host permissions (e.g., "https://*.google.com/*") are handled separately.
 */
const permissionMapping: Record<string, string> = {
  kDebugger: "debugger",
  kFullAccess: "management", // Often associated with high privilege like management or <all_urls>
  kDeclarativeWebRequest: "declarativeWebRequest", // Deprecated, but might appear
  kDeclarativeNetRequestFeedback: "declarativeNetRequestFeedback", // Requires declarativeNetRequest
  kFavicon: "favicon", // Implied by history/tabs/bookmarks? Not usually explicit.
  kHostsAll: "<all_urls>",
  kHostsAllReadOnly: "<all_urls>", // Simplified mapping
  kProcesses: "processes", // Usually implies 'tabs'
  kTab: "tabs",
  kTopSites: "topSites",
  kWebNavigation: "webNavigation",
  kDeclarativeNetRequest: "declarativeNetRequest",
  kWebAuthenticationProxy: "webAuthenticationProxy",
  kHostReadOnly: "<all_urls>", // Simplified mapping
  kHostReadWrite: "<all_urls>", // Simplified mapping
  kNewTabPageOverride: "chrome://newtab", // Not a permission, but indicates override
  kAudioCapture: "audioCapture",
  kVideoCapture: "videoCapture",
  kSpeechRecognitionPrivate: "speechRecognitionPrivate", // Private API
  kGeolocation: "geolocation",
  kHistory: "history",
  kSessions: "sessions",
  kPrinting: "printing",
  kPrintingMetrics: "printingMetrics",
  kSocketAnyHost: "socket", // Simplified mapping
  kSocketDomainHosts: "socket", // Simplified mapping
  kSocketSpecificHosts: "socket", // Simplified mapping
  kUsbDevice: "usbDevices", // Simplified mapping
  kUsbDeviceUnknownProduct: "usbDevices", // Simplified mapping
  kUsbDeviceUnknownVendor: "usbDevices", // Simplified mapping
  kBluetooth: "bluetooth",
  kSerial: "serial",
  kBluetoothDevices: "bluetoothDevices", // Specific device listing
  kBluetoothPrivate: "bluetoothPrivate", // Private API
  kU2fDevices: "u2fDevices",
  kNotifications: "notifications",
  kAccessibilityFeaturesModify: "accessibilityFeatures.modify",
  kAccessibilityFeaturesRead: "accessibilityFeatures.read",
  kMediaGalleriesAllGalleriesCopyTo: "mediaGalleries", // Simplified
  kMediaGalleriesAllGalleriesDelete: "mediaGalleries", // Simplified
  kMediaGalleriesAllGalleriesRead: "mediaGalleries", // Simplified
  kFileSystemWrite: "fileSystemProvider", // Simplified
  kFileSystemDirectory: "fileSystemProvider", // Simplified
  kNetworkingOnc: "networking.onc", // ChromeOS
  kNetworkingPrivate: "networkingPrivate", // Private API
  kNetworkState: "networkState", // ChromeOS?
  kVpnProvider: "vpnProvider", // ChromeOS
  kHomepage: "homepage", // Indicates override setting
  kSearchProvider: "search", // Indicates override setting
  kStartupPages: "startupPages", // Indicates override setting
  kBookmark: "bookmarks",
  kReadingList: "readingList",
  kClipboardRead: "clipboardRead",
  kClipboardWrite: "clipboardWrite",
  kDesktopCapture: "desktopCapture",
  kDownloads: "downloads",
  kDownloadsOpen: "downloads.open",
  kIdentityEmail: "identity.email",
  kSystemStorage: "system.storage",
  kContentSettings: "contentSettings",
  kDocumentScan: "documentScan", // ChromeOS
  kInput: "input", // ChromeOS IME
  kManagement: "management",
  kMDns: "mdns",
  kNativeMessaging: "nativeMessaging",
  kPrivacy: "privacy",
  kSyncFileSystem: "syncFileSystem",
  kTabGroups: "tabGroups",
  kTtsEngine: "ttsEngine",
  kWallpaper: "wallpaper", // ChromeOS
  kPlatformKeys: "platformKeys", // ChromeOS
  kCertificateProvider: "certificateProvider", // ChromeOS
  kActivityLogPrivate: "activityLogPrivate", // Private API
  kSettingsPrivate: "settingsPrivate", // Private API
  kAutofillPrivate: "autofillPrivate", // Private API
  kPasswordsPrivate: "passwordsPrivate", // Private API
  kUsersPrivate: "usersPrivate", // Private API
  kEnterpriseReportingPrivate: "enterprise.reportingPrivate", // Policy
  kEnterpriseHardwarePlatform: "enterprise.hardwarePlatform", // Policy
  kEnterpriseDeviceAttributes: "enterprise.deviceAttributes", // Policy
  kEnterpriseKioskInput: "enterprise.kioskInput", // Policy - ChromeOS
  kEnterpriseNetworkingAttributes: "enterprise.networkingAttributes", // Policy
  kEnterprisePlatformKeys: "enterprise.platformKeys", // Policy
  kOmniboxDirectInput: "omnibox", // Represents a specific omnibox feature flag?
  kLogin: "login", // ChromeOS private
  kLoginScreenUi: "loginScreenUi", // ChromeOS private
  kLoginScreenStorage: "loginScreenStorage", // ChromeOS private
  kEnterpriseRemoteApps: "enterprise.remoteApps", // ChromeOS Policy
  kTransientBackground: "background", // May implicitly need 'background' permission
  kChromeOSAttachedDeviceInfo: "chromeos.attached_device_info", // Telemetry Extension API
  kChromeOSBluetoothPeripheralsInfo: "chromeos.bluetooth_peripherals_info", // Telemetry Extension API
  kChromeOSDiagnostics: "chromeos.diagnostics", // Telemetry Extension API
  kChromeOSDiagnosticsNetworkInfoForMlab: "chromeos.diagnostics.network_info_mlab", // Telemetry Extension API
  kChromeOSEvents: "chromeos.events", // Telemetry Extension API
  kChromeOSManagementAudio: "chromeos.management.audio", // Telemetry Extension API
  kChromeOSTelemetry: "chromeos.telemetry", // Telemetry Extension API
  kChromeOSTelemetrySerialNumber: "chromeos.telemetry.serial_number", // Telemetry Extension API
  kChromeOSTelemetryNetworkInformation: "chromeos.telemetry.network_information" // Telemetry Extension API
};

// Invert the mapping for easier lookup from manifest string to C++ ID (where possible)
const reversePermissionMapping: Record<string, string> = Object.entries(permissionMapping).reduce(
  (acc: Record<string, string>, [key, value]) => {
    if (!acc[value]) {
      // Avoid overwriting simplified mappings like <all_urls>
      acc[value] = key;
    }
    // Add common variations/aliases
    if (value === "tabs") acc["processes"] = key; // processes often implies tabs
    if (value === "<all_urls>") {
      acc["http://*/*"] = key;
      acc["https://*/*"] = key;
      acc["*://*/*"] = key;
    }
    return acc;
  },
  {}
);

export function getReversePermissionMapping(): Record<string, string> {
  return reversePermissionMapping;
}

// --- Define Rules (Translated from C++ array, preserving order) ---
// Each rule: { messageId: string, required: string[], optional: string[] }
// Uses manifest permission strings directly.
interface PermissionRule {
  messageId: string;
  required: string[];
  optional: string[];
}

const permissionRules: PermissionRule[] = [
  // Full access permission messages.
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_DEBUGGER", required: ["debugger"], optional: [] },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_FULL_ACCESS", // This C++ rule seems to map to a very high privilege level. 'management' is a guess.
    required: ["management"], // Or maybe <all_urls> depending on interpretation
    optional: [
      "declarativeWebRequest",
      "declarativeNetRequestFeedback",
      "favicon",
      "<all_urls>",
      "processes",
      "tabs",
      "topSites",
      "webNavigation",
      "declarativeNetRequest"
    ]
  },

  // Hosts permission messages.
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ALL_HOSTS",
    required: ["<all_urls>"],
    optional: [
      "declarativeWebRequest",
      "declarativeNetRequestFeedback",
      "favicon",
      "processes",
      "tabs",
      "topSites",
      "webNavigation",
      "declarativeNetRequest",
      "webAuthenticationProxy"
    ]
  },
  // Simplified: Assuming kHostsAllReadOnly, kHostReadOnly, kHostReadWrite map to <all_urls> or specific host strings handled later.
  // The C++ code has separate rules for kWebAuthenticationProxy requiring <all_urls> message, and kHostsAllReadOnly.
  // We merge these for simplicity, assuming <all_urls> takes precedence.

  // Specific Host Permissions (Simplified - using a generic placeholder)
  // The C++ uses HostListFormatter based on kHostReadWrite/kHostReadOnly. We lack the host list here.
  // We add placeholder rules triggered by common specific host patterns.
  // These rules are placed *after* <all_urls> as per C++ logic.
  // NOTE: This is a major simplification. Real implementation needs manifest parsing.
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_HOST_LIST_FORMATTER",
    required: ["SPECIFIC_HOST_READ_WRITE"],
    optional: []
  }, // Placeholder permission
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_HOST_LIST_FORMATTER_READ_ONLY",
    required: ["SPECIFIC_HOST_READ_ONLY"],
    optional: []
  }, // Placeholder permission

  // New tab page override.
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_NEW_TAB_PAGE_OVERRIDE", required: ["chrome://newtab"], optional: [] }, // Using the URI as a pseudo-permission

  // Video and audio capture.
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_AUDIO_AND_VIDEO_CAPTURE",
    required: ["audioCapture", "videoCapture"],
    optional: []
  },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_AUDIO_CAPTURE", required: ["audioCapture"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_VIDEO_CAPTURE", required: ["videoCapture"], optional: [] },

  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_SPEECH_RECOGNITION",
    required: ["speechRecognitionPrivate"],
    optional: []
  }, // Private API

  { messageId: "IDS_EXTENSION_PROMPT_WARNING_GEOLOCATION", required: ["geolocation"], optional: [] },

  // History-related permission messages.
  // Note: Order matters. Combined messages first.
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_HISTORY_WRITE_ON_ALL_DEVICES", // Highest history warning
    required: ["history"],
    optional: ["declarativeNetRequestFeedback", "favicon", "processes", "tabs", "topSites", "webNavigation", "sessions"]
  }, // Added sessions based on next rule
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_HISTORY_READ_ON_ALL_DEVICES", // Read history across devices
    required: ["tabs", "sessions"],
    optional: ["declarativeNetRequestFeedback", "favicon", "processes", "topSites", "webNavigation"]
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_HISTORY_READ", // Read history (triggered by tabs)
    required: ["tabs"],
    optional: ["declarativeNetRequestFeedback", "favicon", "processes", "topSites", "webNavigation"]
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_HISTORY_READ", // Read history (triggered by processes)
    required: ["processes"],
    optional: ["declarativeNetRequestFeedback", "favicon", "topSites", "webNavigation"]
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_HISTORY_READ", // Read history (triggered by webNavigation)
    required: ["webNavigation"],
    optional: ["declarativeNetRequestFeedback", "favicon", "topSites"]
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_HISTORY_READ", // Read history (triggered by declarativeNetRequestFeedback)
    required: ["declarativeNetRequestFeedback"],
    optional: ["favicon", "topSites"]
  },
  // Lower priority history-related items
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_FAVICON", required: ["favicon"], optional: [] }, // Often implicit
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_TOPSITES", required: ["topSites"], optional: [] },

  { messageId: "IDS_EXTENSION_PROMPT_WARNING_PRINTING", required: ["printing"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_PRINTING_METRICS", required: ["printingMetrics"], optional: [] },

  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_DECLARATIVE_WEB_REQUEST",
    required: ["declarativeWebRequest"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_DECLARATIVE_NET_REQUEST",
    required: ["declarativeNetRequest"],
    optional: []
  },

  // Messages generated by the sockets permission (Simplified)
  // Assuming 'socket' permission covers all variants mentioned in C++
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_SOCKET_ANY_HOST", required: ["socket"], optional: [] },
  // The C++ uses formatters for specific/domain hosts which we can't replicate here.

  // Devices-related messages (Simplified)
  // USB - Simplified to one message
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_USB_DEVICES", required: ["usbDevices"], optional: [] },
  // Bluetooth and Serial
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_BLUETOOTH_SERIAL",
    required: ["bluetooth", "serial"],
    optional: ["bluetoothDevices"]
  },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_BLUETOOTH", required: ["bluetooth"], optional: ["bluetoothDevices"] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_BLUETOOTH_DEVICES", required: ["bluetoothDevices"], optional: [] }, // If only specific devices requested
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_BLUETOOTH_PRIVATE", required: ["bluetoothPrivate"], optional: [] }, // Private API
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_SERIAL", required: ["serial"], optional: [] },
  // U2F
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_U2F_DEVICES", required: ["u2fDevices"], optional: [] },

  // Notifications.
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_NOTIFICATIONS", required: ["notifications"], optional: [] },

  // Accessibility features.
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ACCESSIBILITY_FEATURES_READ_MODIFY",
    required: ["accessibilityFeatures.modify", "accessibilityFeatures.read"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ACCESSIBILITY_FEATURES_MODIFY",
    required: ["accessibilityFeatures.modify"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ACCESSIBILITY_FEATURES_READ",
    required: ["accessibilityFeatures.read"],
    optional: []
  },

  // Media galleries permissions (Simplified)
  // Assuming 'mediaGalleries' covers all read/write/delete variants.
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_MEDIA_GALLERIES_READ_WRITE_DELETE",
    required: ["mediaGalleries"],
    optional: []
  },
  // C++ has finer-grained rules which we can't map easily without knowing the exact sub-permissions declared.

  // File system permissions (Simplified)
  // Assuming 'fileSystemProvider' covers directory read/write. C++ differentiates write+directory vs directory-only.
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_FILE_SYSTEM_WRITE_DIRECTORY",
    required: ["fileSystemProvider"],
    optional: []
  },

  // Network-related permissions.
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_NETWORKING_PRIVATE",
    required: ["networking.onc"],
    optional: ["networkingPrivate"]
  }, // ChromeOS
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_NETWORKING_PRIVATE", required: ["networkingPrivate"], optional: [] }, // Private API
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_NETWORK_STATE", required: ["networkState"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_VPN", required: ["vpnProvider"], optional: [] }, // ChromeOS

  // Settings Overrides (Simplified)
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_SETTINGS_OVERRIDE_FORMATTER", required: ["homepage"], optional: [] }, // Using pseudo-permission
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_SETTINGS_OVERRIDE_FORMATTER", required: ["search"], optional: [] }, // Using pseudo-permission
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_SETTINGS_OVERRIDE_FORMATTER", required: ["startupPages"], optional: [] }, // Using pseudo-permission

  { messageId: "IDS_EXTENSION_PROMPT_WARNING_BOOKMARKS", required: ["bookmarks"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_READING_LIST", required: ["readingList"], optional: [] },

  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_CLIPBOARD_READWRITE",
    required: ["clipboardRead", "clipboardWrite"],
    optional: []
  },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_CLIPBOARD", required: ["clipboardRead"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_CLIPBOARD_WRITE", required: ["clipboardWrite"], optional: [] },

  { messageId: "IDS_EXTENSION_PROMPT_WARNING_DESKTOP_CAPTURE", required: ["desktopCapture"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_DOWNLOADS", required: ["downloads"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_DOWNLOADS_OPEN", required: ["downloads.open"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_IDENTITY_EMAIL", required: ["identity.email"], optional: [] },

  { messageId: "IDS_EXTENSION_PROMPT_WARNING_SYSTEM_STORAGE", required: ["system.storage"], optional: [] },

  { messageId: "IDS_EXTENSION_PROMPT_WARNING_CONTENT_SETTINGS", required: ["contentSettings"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_DOCUMENT_SCAN", required: ["documentScan"], optional: [] }, // ChromeOS
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_INPUT", required: ["input"], optional: [] }, // ChromeOS IME
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_MANAGEMENT", required: ["management"], optional: [] }, // Note: Duplicates a higher rule, might be shadowed
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_MDNS", required: ["mdns"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_NATIVE_MESSAGING", required: ["nativeMessaging"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_PRIVACY", required: ["privacy"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_SYNCFILESYSTEM", required: ["syncFileSystem"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_TAB_GROUPS", required: ["tabGroups"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_TTS_ENGINE", required: ["ttsEngine"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_WALLPAPER", required: ["wallpaper"], optional: [] }, // ChromeOS
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_PLATFORMKEYS", required: ["platformKeys"], optional: [] }, // ChromeOS
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_CERTIFICATEPROVIDER", required: ["certificateProvider"], optional: [] }, // ChromeOS

  // --- Private / Enterprise APIs from GRD ---
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_ACTIVITY_LOG_PRIVATE", required: ["activityLogPrivate"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_SETTINGS_PRIVATE", required: ["settingsPrivate"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_AUTOFILL_PRIVATE", required: ["autofillPrivate"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_PASSWORDS_PRIVATE", required: ["passwordsPrivate"], optional: [] },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_USERS_PRIVATE", required: ["usersPrivate"], optional: [] },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_REPORTING_PRIVATE",
    required: ["enterprise.reportingPrivate"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_HARDWARE_PLATFORM",
    required: ["enterprise.hardwarePlatform"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_DEVICE_ATTRIBUTES",
    required: ["enterprise.deviceAttributes"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_KIOSK_INPUT",
    required: ["enterprise.kioskInput"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_NETWORKING_ATTRIBUTES",
    required: ["enterprise.networkingAttributes"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_PLATFORMKEYS",
    required: ["enterprise.platformKeys"],
    optional: []
  },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_OMNIBOX_DIRECT_INPUT", required: ["omnibox"], optional: [] }, // Simplified mapping
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_LOGIN", required: ["login"], optional: [] }, // ChromeOS private
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_LOGIN_SCREEN_UI", required: ["loginScreenUi"], optional: [] }, // ChromeOS private
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_LOGIN_SCREEN_STORAGE", required: ["loginScreenStorage"], optional: [] }, // ChromeOS private
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_ENTERPRISE_REMOTE_APPS",
    required: ["enterprise.remoteApps"],
    optional: []
  },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_TRANSIENT_BACKGROUND", required: ["background"], optional: [] }, // Mapping kTransientBackground to 'background'

  // --- Telemetry System Extension permission messages ---
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_ATTACHED_DEVICE_INFO",
    required: ["chromeos.attached_device_info"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_BLUETOOTH_PERIPHERALS_INFO",
    required: ["chromeos.bluetooth_peripherals_info"],
    optional: []
  },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_DIAGNOSTICS", required: ["chromeos.diagnostics"], optional: [] },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_DIAGNOSTICS_NETWORK_INFO_FOR_MLAB",
    required: ["chromeos.diagnostics.network_info_mlab"],
    optional: []
  },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_EVENTS", required: ["chromeos.events"], optional: [] },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_MANAGEMENT_AUDIO",
    required: ["chromeos.management.audio"],
    optional: []
  },
  { messageId: "IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_TELEMETRY", required: ["chromeos.telemetry"], optional: [] },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_TELEMETRY_SERIAL_NUMBER",
    required: ["chromeos.telemetry.serial_number"],
    optional: []
  },
  {
    messageId: "IDS_EXTENSION_PROMPT_WARNING_CHROMEOS_TELEMETRY_NETWORK_INFORMATION",
    required: ["chromeos.telemetry.network_information"],
    optional: []
  }
];

/**
 * Determines if a permission string represents a specific host pattern
 * (as opposed to <all_urls> or a standard permission string).
 * @param {string} permission The permission string.
 * @returns {boolean} True if it looks like a specific host pattern.
 */
function isSpecificHostPermission(permission: string): boolean {
  return permission.includes("://") || permission.startsWith("*");
}

/**
 * Processes a list of manifest permissions and generates user-facing warning messages.
 * Follows the precedence rules defined in Chromium source.
 *
 * @param {string[]} manifestPermissions An array of permission strings from manifest.json.
 * @param {string[]} hostPermissions An array of host permission strings (e.g., "<all_urls>", "https://*.google.com/*")
 * @returns {string[]} An array of user-facing warning strings.
 */
export function getPermissionWarnings(manifestPermissions: string[], hostPermissions: string[] = []): string[] {
  const allInputPermissions = [...new Set([...manifestPermissions, ...hostPermissions])];
  const availablePermissions = new Set(allInputPermissions);
  const generatedWarnings = new Set<string>(); // Use Set to avoid duplicate messages

  // --- Pre-processing for specific host permissions ---
  // Replace specific host strings with placeholder permissions for rule matching.
  // This is a simplification of the C++ formatter logic.
  let hasSpecificHostReadWrite = false;
  availablePermissions.forEach((perm) => {
    if (isSpecificHostPermission(perm) && perm !== "<all_urls>") {
      hasSpecificHostReadWrite = true;
      // Mark the specific host perm for removal later if matched by a generic rule
    }
  });
  // Add placeholder permissions if specific hosts were found (and remove the originals for now)
  const specificHostsToRemove: string[] = [];
  if (hasSpecificHostReadWrite && !availablePermissions.has("<all_urls>")) {
    availablePermissions.add("SPECIFIC_HOST_READ_WRITE");
    availablePermissions.forEach((perm) => {
      if (isSpecificHostPermission(perm) && perm !== "<all_urls>") {
        specificHostsToRemove.push(perm);
      }
    });
  }
  // (Could add similar logic for SPECIFIC_HOST_READ_ONLY if needed)
  specificHostsToRemove.forEach((host) => availablePermissions.delete(host));
  // --- End Host Pre-processing ---

  permissionRules.forEach((rule) => {
    // Check if all required permissions for this rule are still available
    const requiredPresent = rule.required.every((req) => availablePermissions.has(req));

    if (requiredPresent) {
      // Add the corresponding warning message
      const messageId = rule.messageId as keyof typeof permissionMessages;
      const message = permissionMessages[messageId] || permissionMessages["DEFAULT"] + ` (${rule.messageId})`; // Fallback
      generatedWarnings.add(message);

      // Consume the required permissions
      rule.required.forEach((req) => availablePermissions.delete(req));

      // Consume the optional permissions associated with this rule
      rule.optional.forEach((opt) => availablePermissions.delete(opt));

      // If this rule was a placeholder for specific hosts, remove the placeholder
      if (rule.required.includes("SPECIFIC_HOST_READ_WRITE")) {
        availablePermissions.delete("SPECIFIC_HOST_READ_WRITE");
      }
      if (rule.required.includes("SPECIFIC_HOST_READ_ONLY")) {
        availablePermissions.delete("SPECIFIC_HOST_READ_ONLY");
      }
    }
  });

  // --- Post-processing ---
  // Add warnings for any remaining high-impact permissions not covered by rules (e.g., unrecognized host patterns)
  availablePermissions.forEach((perm) => {
    if (isSpecificHostPermission(perm) && perm !== "<all_urls>") {
      // If specific hosts remained, it means the <all_urls> rule didn't consume them,
      // and our simplified specific host rules didn't trigger or were overridden.
      // Add a generic warning if not already present.
      const genericHostMessage = permissionMessages["IDS_EXTENSION_PROMPT_WARNING_HOST_LIST_FORMATTER"];
      if (!generatedWarnings.has(genericHostMessage)) {
        generatedWarnings.add(genericHostMessage);
      }
    }
    // Potentially add checks for other remaining permissions if needed
  });

  return Array.from(generatedWarnings);
}

// Example Usage:
/*
  const manifestPerms = ["history", "storage", "tabs", "declarativeNetRequest"];
  const hostPerms = ["<all_urls>"];
  const warnings = getPermissionWarnings(manifestPerms, hostPerms);
  console.log("Warnings for <all_urls>, history, storage, tabs, declarativeNetRequest:");
  console.log(warnings);
  // Expected Output might prioritize "Read and change all your data on all websites"
  // and potentially "Read and change your Browse history on all your signed-in devices"
  // depending on how the <all_urls> rule absorbs 'history' and 'tabs'. Based on C++,
  // <all_urls> should absorb 'tabs' and 'declarativeNetRequest', leading to:
  // [
  //   "Read and change all your data on all websites",
  //   "Read and change your Browse history on all your signed-in devices" // Because history is explicitly requested and not absorbed by <all_urls> rule
  //   "Store data on your device" // Assuming storage maps to a basic warning if not absorbed
  // ]
  // --> Actual C++ might show fewer warnings due to more complex absorption. This JS version is an approximation.
  
  const manifestPerms2 = ["tabs", "activeTab", "scripting"];
  const hostPerms2 = ["https://www.google.com/*", "https://developer.chrome.com/*"];
  const warnings2 = getPermissionWarnings(manifestPerms2, hostPerms2);
  console.log("\nWarnings for tabs, activeTab, scripting, specific hosts:");
  console.log(warnings2);
  // Expected:
  // [
  //   "Read your Browse history", // From 'tabs' rule
  //   "Access your data on specific sites" // From the simplified specific host rule
  //   // activeTab and scripting usually don't generate top-level warnings themselves
  // ]
  
  const manifestPerms3 = ["geolocation", "notifications", "tts"];
  const warnings3 = getPermissionWarnings(manifestPerms3);
  console.log("\nWarnings for geolocation, notifications, tts:");
  console.log(warnings3);
  // Expected:
  // [
  //   "Detect your physical location",
  //   "Display notifications",
  //   "Read aloud text using text-to-speech" // Assuming 'tts' maps to a warning
  // ]
  */
