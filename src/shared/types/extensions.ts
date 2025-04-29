type ExtensionInspectView = "service_worker" | "background";

export type ExtensionType = "unpacked" | "crx";

export interface SharedExtensionData {
  type: ExtensionType;
  id: string;
  name: string;
  short_name?: string;
  description?: string;
  icon: string;
  enabled: boolean;
  pinned: boolean;
  version: string;
  path: string;
  size: number;
  permissions: string[];
  inspectViews: ExtensionInspectView[];
}
