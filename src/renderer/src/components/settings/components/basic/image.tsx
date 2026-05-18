import { cn } from "@/lib/utils";

export function ImageComp({ src, className }: { src: string; className?: string }) {
  return <img src={src} className={cn("pointer-events-none", className)} />;
}
