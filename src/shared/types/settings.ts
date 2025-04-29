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

export type SettingType = SettingTypeBoolean | SettingTypeEnum;

// Setting //
export type BasicSetting = {
  id: string;
  name: string;
  showName?: boolean;
} & SettingType;

// Setting Card //
export type BasicSettingCard = {
  title: string;
  subtitle: string;
  settings: string[];
};
