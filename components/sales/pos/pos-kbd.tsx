// coding-standard: maintained
import { cn } from "@ui/lib/utils";

/** A key cap for the counter's shortcut hints (F2, F8, Esc …). */
export function PosKbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-b-2 bg-card px-1.5 font-mono text-[11px] font-semibold text-foreground",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
