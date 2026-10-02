// coding-standard: maintained
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { cn } from "@ui/lib/utils";
import { Package } from "lucide-react";

/**
 * A product's photo beside its name in a sale (the POS cart and its search
 * list). Falls back to the box icon when the product has no photo or it fails
 * to load, so a catalogue without images still lines up.
 */
export function ProductThumb({
  src,
  size = "md",
  className,
}: {
  src?: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <Avatar
      className={cn(
        "shrink-0 rounded-md border bg-muted",
        size === "lg" ? "size-12" : "size-10",
        className,
      )}
    >
      {src ? <AvatarImage src={src} alt="" className="object-cover" /> : null}
      <AvatarFallback className="rounded-md bg-muted text-muted-foreground/60">
        <Package className="size-5" />
      </AvatarFallback>
    </Avatar>
  );
}
