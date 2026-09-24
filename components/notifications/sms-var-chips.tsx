"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Button } from "@/ui/components/button";

/**
 * One button per variable this event offers, inserting `{name}` at the cursor.
 *
 * The list comes from the backend registry (`row.vars`), so a variable the
 * server does not know can never be offered — and typing braces by hand is the
 * one way to make the V3 "doesn't exist" error. Labels say what the value is
 * ("COD amount"), not its syntax; a variable with no translated label falls
 * back to its raw name rather than disappearing.
 */
export function SmsVarChips({
  vars,
  onInsert,
  disabled,
}: {
  vars: string[];
  onInsert: (token: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("settings.notifications.smsEditor");

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">{t("insert")}</p>
      <div className="flex flex-wrap gap-1.5">
        {vars.map((name) => (
          <Button
            key={name}
            type="button"
            size="sm"
            variant="outline"
            className="h-8 gap-1 rounded-full px-2.5 text-xs"
            disabled={disabled}
            onClick={() => onInsert(`{${name}}`)}
          >
            <Plus className="size-3" />
            {t.has(`vars.${name}`) ? t(`vars.${name}` as never) : name}
          </Button>
        ))}
      </div>
    </div>
  );
}
