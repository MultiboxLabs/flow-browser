import { Button } from "@/components/ui/button";
import { EllipsisVerticalIcon } from "lucide-react";

export function BottomExtrasMenu() {
  return (
    <Button
      size="icon"
      className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10"
      onClick={() => flow.windows.openSettingsWindow()}
      disabled
    >
      <EllipsisVerticalIcon strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
    </Button>
  );
}
