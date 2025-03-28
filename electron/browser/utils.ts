// Shared utility variables
let _webuiExtensionId: string | undefined;

export const webuiExtensionId = (): string | undefined => _webuiExtensionId;
export const setWebuiExtensionId = (id: string): void => {
  _webuiExtensionId = id;
};

// Null guard utilities
export function assertNotNull<T>(value: T | null | undefined, message: string = "Value cannot be null"): T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value;
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
