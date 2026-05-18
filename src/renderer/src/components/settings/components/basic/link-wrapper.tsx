import { cn } from "@/lib/utils";

export function LinkWrapper({
  href,
  children,
  className
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn("cursor-default", className)}
      style={{ WebkitUserDrag: "none" } as React.CSSProperties}
      tabIndex={-1}
    >
      {children}
    </a>
  );
}
