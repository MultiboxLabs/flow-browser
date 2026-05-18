import { cn } from "@/lib/utils";

export function ExtraInfoAction({ text, textColor = "muted" }: { text: string; textColor?: "normal" | "muted" }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("text-sm", textColor === "muted" ? "text-muted-foreground" : "text-black dark:text-white")}>
        {text}
      </span>
    </div>
  );
}
