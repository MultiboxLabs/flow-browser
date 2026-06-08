// This is used to create a simple settings framework.
// This will make it easier to add new settings and cards.

// Setting Type: Boolean //
type SettingTypeBoolean = {
  type: "boolean";
  defaultValue: boolean;
};

// Setting Type: Enum //
type SettingTypeEnumOption = {
  id: string;
  name: string;
};

type SettingTypeEnum = {
  type: "enum";
  defaultValue: string;
  options: SettingTypeEnumOption[];
};

// Setting Type: String //
type SettingTypeString = {
  type: "string";
  defaultValue: string;
  placeholder?: string;
};

export type SettingType = SettingTypeBoolean | SettingTypeEnum | SettingTypeString;

// Setting //
export type BasicSetting = {
  id: string;
  name: string;
  showName?: boolean;
  description?: string;
} & SettingType;

// Setting Card //
export type BasicSettingCard = {
  title: string;
  subtitle: string;
  settings: string[];
};
