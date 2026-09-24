"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import type { SmsTemplateCase } from "@/types/api";
import { Badge } from "@/ui/components/badge";

/**
 * "How it will look" — the draft rendered for each situation a customer can
 * actually be in, exactly as the dispatcher would send it: a typical order, a
 * long name, a name in Bangla, no name, a prepaid order.
 *
 * Every text here comes from the server's fit ladder. The merchant sees the
 * worst case before a customer does — and sees WHY a word changed ("name
 * replaced by 'Customer'"), which is what makes a Bangla name turning into the
 * fallback read as a rule rather than a bug.
 */
export function SmsFitCases({ cases }: { cases: SmsTemplateCase[] }) {
  const t = useTranslations("settings.notifications.smsEditor");
  if (cases.length === 0) return null;

  const varLabel = (name: string) =>
    t.has(`vars.${name}`) ? t(`vars.${name}` as never) : name;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{t("casesTitle")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {cases.map((item) => (
          <div key={item.id} className="rounded-lg border bg-muted/30 p-2.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{t(`cases.${item.id}`)}</span>
              <Badge
                variant={item.segments > 1 ? "destructive" : "secondary"}
                className="text-[10px]"
              >
                {item.segments === 1
                  ? t("oneSms")
                  : t("segments", { count: item.segments })}
              </Badge>
            </div>
            {/* The SMS itself, set like a message bubble. `break-words` because
                a tracking code or an unspaced name must wrap on a phone rather
                than widen the sheet. */}
            <p className="whitespace-pre-wrap break-words rounded-md bg-background px-2.5 py-2 text-xs leading-relaxed">
              {item.text}
            </p>
            {item.fit === "builtin" && (
              <p className="mt-1 text-[11px] text-destructive">
                {t("change.builtin")}
              </p>
            )}
            {item.changes.map((change) => (
              <p
                key={change.variable}
                className="mt-1 text-[11px] text-muted-foreground"
              >
                {t(`change.${change.action}`, {
                  variable: varLabel(change.variable),
                  value: change.value,
                })}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
