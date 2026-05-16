import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Children } from "react";

export function ContainerSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return <Separator className={cn("bg-black/10 dark:bg-white/10", className)} {...props} />;
}

export function ContainerItem({
  icon,
  title,
  description,
  className
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;

  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-medium leading-tight">{title}</span>
        <span className="truncate text-xs leading-tight text-muted-foreground">{description}</span>
      </div>
    </div>
  );
}

type ContainerProps = React.ComponentProps<"div"> & {
  withSeparators?: boolean;
};

export function Container({ className, children, withSeparators = false, ...props }: ContainerProps) {
  const content = withSeparators
    ? Children.toArray(children).flatMap((child, index, arr) =>
        index < arr.length - 1 ? [child, <ContainerSeparator key={`container-sep-${index}`} />] : [child]
      )
    : children;

  return (
    <div className={cn("rounded-xl px-3", "bg-black/3 dark:bg-white/3", className)} {...props}>
      {content}
    </div>
  );
}
