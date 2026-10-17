// coding-standard: maintained
import { useTranslations } from "next-intl";

/**
 * The "/mo", "/6 mo", "/yr" after a plan's price. Honors `intervalCount` — a
 * 6-month plan is "/6 mo", never "/mo". Shared by the billing page's plan card
 * and the signup plan picker so the two never price a plan differently.
 */
export function usePlanIntervalSuffix(): (plan: {
  interval: string;
  intervalCount?: number;
}) => string {
  const t = useTranslations("settings.billing.interval");
  return (plan) => {
    const n = plan.intervalCount ?? 1;
    if (plan.interval === "month") {
      return n > 1 ? t("everyNMonthsSuffix", { n }) : t("monthSuffix");
    }
    if (plan.interval === "year") {
      return n > 1 ? t("everyNYearsSuffix", { n }) : t("yearSuffix");
    }
    return "";
  };
}
