"use client";
// coding-standard: maintained

import { Alert, AlertDescription, AlertTitle } from "@/ui/components/alert";
import { FlaskConical } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * AI replies are new (the pilot is still running): said once, at the top of Inbox settings, so the
 * merchant checks its answers and flags the wrong ones. For the merchant only — nothing about
 * "beta" ever goes into a customer's chat.
 */
export function AiBetaNotice() {
  const t = useTranslations("inbox.settings.aiBeta");
  return (
    <Alert>
      <FlaskConical className="h-4 w-4" />
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription>{t("body")}</AlertDescription>
    </Alert>
  );
}
