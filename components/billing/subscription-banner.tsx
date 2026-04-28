import { differenceInDays, format } from "date-fns";
import { AlertTriangle, Clock, Info, ShieldAlert } from "lucide-react";

import type {
  YocoreSubscriptionSnapshot,
  YocoreSubscriptionStatus,
} from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@ui/components/alert";

interface SubscriptionBannerProps {
  organizationStatus: "active" | "inactive" | "read_only";
  deletionScheduledAt: string | null;
  subscription: YocoreSubscriptionSnapshot | null;
}

interface BannerVariant {
  tone: "info" | "warning" | "destructive";
  Icon: typeof Info;
  title: string;
  description: string;
}

function buildVariant(
  organizationStatus: SubscriptionBannerProps["organizationStatus"],
  deletionScheduledAt: string | null,
  subscription: YocoreSubscriptionSnapshot | null,
): BannerVariant | null {
  // Workspace-level destructive states win.
  if (organizationStatus === "read_only") {
    const dt = deletionScheduledAt ? new Date(deletionScheduledAt) : null;
    return {
      tone: "destructive",
      Icon: ShieldAlert,
      title: "Workspace is read-only",
      description: dt
        ? `This workspace is scheduled for deletion on ${format(dt, "PPP")}. Reactivate from YoCore to keep your data.`
        : "This workspace is read-only. Reactivate from YoCore to resume operations.",
    };
  }

  if (!subscription) return null;

  const status = subscription.status as YocoreSubscriptionStatus;

  if (status === "trialing") {
    const trialEnd = subscription.trialEndsAt
      ? new Date(subscription.trialEndsAt)
      : null;
    const daysLeft = trialEnd
      ? Math.max(0, differenceInDays(trialEnd, new Date()))
      : null;
    return {
      tone: "info",
      Icon: Info,
      title: "You are on a trial",
      description: trialEnd
        ? `Trial ends on ${format(trialEnd, "PPP")}${daysLeft !== null ? ` (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)` : ""}.`
        : "Your trial period is currently active.",
    };
  }

  if (status === "grace") {
    const periodEnd = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : null;
    return {
      tone: "warning",
      Icon: Clock,
      title: "Payment overdue — grace period",
      description: periodEnd
        ? `Update your billing method before ${format(periodEnd, "PPP")} to avoid service interruption.`
        : "Update your billing method to avoid service interruption.",
    };
  }

  if (status === "past_due") {
    return {
      tone: "warning",
      Icon: AlertTriangle,
      title: "Payment past due",
      description:
        "Your last payment failed. Some sales features may be temporarily disabled. Update payment in YoCore.",
    };
  }

  if (status === "paused" || status === "canceled" || status === "expired") {
    return {
      tone: "destructive",
      Icon: ShieldAlert,
      title: `Subscription ${status}`,
      description:
        "Sales and most write operations are disabled until the plan is reactivated in YoCore.",
    };
  }

  if (status === "active" && subscription.cancelAtPeriodEnd) {
    const periodEnd = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : null;
    return {
      tone: "info",
      Icon: Info,
      title: "Cancellation scheduled",
      description: periodEnd
        ? `Your plan will end on ${format(periodEnd, "PPP")}. You can resume it from YoCore before then.`
        : "Your plan will end at the end of the current billing period.",
    };
  }

  return null;
}

const TONE_CLASSES: Record<BannerVariant["tone"], string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
  destructive:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200",
};

export function SubscriptionBanner({
  organizationStatus,
  deletionScheduledAt,
  subscription,
}: SubscriptionBannerProps) {
  const variant = buildVariant(
    organizationStatus,
    deletionScheduledAt,
    subscription,
  );
  if (!variant) return null;

  const { Icon, title, description, tone } = variant;
  return (
    <Alert className={TONE_CLASSES[tone]}>
      <Icon className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
