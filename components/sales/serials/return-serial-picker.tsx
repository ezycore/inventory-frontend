"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { cn } from "@ui/lib/utils";

/**
 * Which serial / IMEI units come back on a return — optional. Each code on the
 * sale line is a toggle; picking one raises the return quantity to match. A
 * code returned before is refused by the server, which names it.
 */
export function ReturnSerialPicker({
  serials,
  picked,
  onChange,
}: {
  serials?: readonly string[] | null;
  picked: readonly string[];
  onChange: (picked: string[]) => void;
}) {
  const t = useTranslations("sales.serials");
  if (!serials?.length) return null;
  const toggle = (code: string) =>
    onChange(picked.includes(code) ? picked.filter((c) => c !== code) : [...picked, code]);

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">{t("returnPick")}</p>
      <div className="flex flex-wrap gap-1.5">
        {serials.map((code) => (
          <button
            key={code}
            type="button"
            aria-pressed={picked.includes(code)}
            onClick={() => toggle(code)}
            className={cn(
              "rounded-md border px-2 py-0.5 font-mono text-xs",
              picked.includes(code)
                ? "border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}
