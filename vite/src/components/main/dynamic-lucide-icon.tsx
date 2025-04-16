import { useState, useEffect, ComponentPropsWithoutRef } from "react";
import { getLucideIcon } from "@/lib/utils";
import { CircleHelpIcon, LucideIcon } from "lucide-react";

export function DynamicLucideIcon({ iconId, ...props }: { iconId: string } & ComponentPropsWithoutRef<LucideIcon>) {
  const [Icon, setIcon] = useState<LucideIcon>(CircleHelpIcon);

  useEffect(() => {
    getLucideIcon(iconId).then(setIcon);
  }, [iconId]);

  return <Icon {...props} />;
}
