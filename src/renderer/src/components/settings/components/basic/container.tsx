import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Children } from "react";

export function ContainerSeparator({ className, ...props }: React.ComponentProps<typeof Separator>) {
  return (
    <div className="w-full px-3">
      <Separator className={cn("bg-black/10 dark:bg-white/10", className)} {...props} />
    </div>
  );
}

export function ContainerItem({
  icon,
  title,
  description,
  action,

  skeleton = false,

  clickEffect,
  className,
  ...props
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;

  skeleton?: boolean;

  clickEffect?: boolean;
  action?: React.ReactNode;
} & React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3",
        clickEffect && "active:bg-black/5 dark:active:bg-white/5",
        className
      )}
      {...props}
    >
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {skeleton ? (
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 bg-black/10 dark:bg-white/10 rounded-full">
              <span className="truncate text-sm font-medium leading-tight text-transparent">{title}</span>
            </Skeleton>
          </div>
        ) : (
          <span className="truncate text-sm font-medium leading-tight">{title}</span>
        )}
        {description && <span className="truncate text-xs leading-tight text-muted-foreground">{description}</span>}
      </div>
      {action}
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
    <div className={cn("rounded-xl", "bg-black/3 dark:bg-white/3", "overflow-hidden", className)} {...props}>
      {content}
    </div>
  );
}
