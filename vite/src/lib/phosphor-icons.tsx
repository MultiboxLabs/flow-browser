import { IconEntry, icons } from "@phosphor-icons/core";
import * as IconComponents from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";
import { ComponentProps } from "react";

export const PhosphorIcons = icons as unknown as IconEntry[];

type IconId = keyof typeof IconComponents;

export function PhosphorIcon({
  id,
  fallbackId,
  ...props
}: { id: IconId | (string & Record<never, never>); fallbackId?: string } & IconProps) {
  const Icon = IconComponents[id as IconId];

  // Check if Icon is a function (component type)
  if ((Icon && typeof Icon === "function") || typeof Icon === "object") {
    const IconComponent = Icon as React.ComponentType<IconProps>;
    return <IconComponent {...props} />;
  }

  if (fallbackId && fallbackId !== id) {
    return <PhosphorIcon id={fallbackId} {...props} />;
  }

  return null;
}

export function SpaceIcon({ ...props }: ComponentProps<typeof PhosphorIcon>) {
  return <PhosphorIcon fallbackId="DotOutline" weight="duotone" {...props} />;
}
