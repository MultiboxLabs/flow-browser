// This is used to create a simple settings framework.
// This will make it easier to add new settings and cards.

// Setting Type: Boolean //
type SettingTypeBoolean = {
  type: "boolean";
  defaultValue: boolean;
};

// Setting Type: Enum String //
type SettingTypeEnumStringOption = {
  id: string;
  name: string;
};

type SettingTypeEnumString = {
  type: "enumString";
  defaultValue: string;
  options: SettingTypeEnumStringOption[];
};

// Setting Type: Enum Number //
type SettingTypeEnumNumberOption = {
  id: number;
  name: string;
};

type SettingTypeEnumNumber = {
  type: "enumNumber";
  defaultValue: number;
  options: SettingTypeEnumNumberOption[];
};

export type SettingType = SettingTypeBoolean | SettingTypeEnumString | SettingTypeEnumNumber;

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
