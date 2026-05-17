import { cn } from "@/lib/utils";

export function SectionHeader({
  title,
  description,
  icon,
  iconClassName
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  iconClassName?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 pt-4 pb-4">
      <div className={cn("size-13.5 flex items-center justify-center mb-1", iconClassName)}>{icon}</div>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
