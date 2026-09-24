"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { SmsTemplateError, SmsTemplatePreview } from "@/types/api";
import { cn } from "@/ui/lib/utils";

/**
 * The server's verdict on a draft: whether it fits one SMS, the worst-case
 * character budget, each rule it breaks, and anything worth knowing that is
 * not an error. Nothing here measures or checks — it renders what the preview
 * endpoint said, in the merchant's language, keyed by `code`.
 */
export function SmsTemplateFeedback({
  preview,
  checking,
}: {
  preview: SmsTemplatePreview | undefined;
  checking: boolean;
}) {
  const t = useTranslations("settings.notifications.smsEditor");
  if (!preview) {
    return checking ? (
      <p className="text-xs text-muted-foreground">{t("checking")}</p>
    ) : null;
  }

  const { used, limit } = preview.budget;
  const overBudget = used > limit;

  const errorText = (error: SmsTemplateError): string => {
    const placeholder = `{${error.placeholder ?? ""}}`;
    if (error.code === "SMS_TEMPLATE_UNKNOWN_VAR") {
      return error.suggestion
        ? t("errors.SMS_TEMPLATE_UNKNOWN_VAR_SUGGEST", {
            placeholder,
            suggestion: `{${error.suggestion}}`,
          })
        : t("errors.SMS_TEMPLATE_UNKNOWN_VAR", { placeholder });
    }
    // An unknown code (a newer backend) falls back to the server's English.
    return t.has(`errors.${error.code}`)
      ? // Typed as the richest message: every code's text takes at most these values.
        t(`errors.${error.code}` as "errors.SMS_TEMPLATE_EXTENDED_CHAR", {
          char: error.char ?? "",
          braces: "{ }",
        })
      : error.message;
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs",
          overBudget ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {overBudget ? (
          <AlertCircle className="size-3.5" />
        ) : (
          <CheckCircle2 className="size-3.5 text-emerald-600" />
        )}
        <span className="font-medium">
          {overBudget ? t("tooLong") : t("fits")}
        </span>
        {used > 0 && <span>· {t("budget", { used, limit })}</span>}
        {checking && <span>· {t("checking")}</span>}
      </div>

      {preview.errors.length > 0 && (
        <ul className="space-y-1">
          {preview.errors
            // TOO_LONG is already the meter's headline; listing it twice is noise.
            .filter((error) => error.code !== "SMS_TEMPLATE_TOO_LONG")
            .map((error, index) => (
              <li
                key={`${error.code}-${index}`}
                className="flex gap-1.5 text-xs text-destructive"
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{errorText(error)}</span>
              </li>
            ))}
        </ul>
      )}

      {preview.warnings.includes("store_phone_empty") && (
        <p className="flex gap-1.5 text-xs text-amber-700 dark:text-amber-300">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t("storePhoneEmpty", { variable: t("vars.store_phone") })}
          </span>
        </p>
      )}
    </div>
  );
}
