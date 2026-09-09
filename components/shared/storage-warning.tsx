"use client";
// coding-standard: maintained

import Link from "next/link";
import { AlertCircle, HardDrive } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCanManageBilling } from "@/hooks/use-has-permission";
import { useStorageLimit } from "@/hooks/use-plan-limit";
import { formatBytes } from "@/lib/format";

/**
 * "You are running out of storage", said where the merchant is about to spend
 * it — inside an image field, before they pick a file.
 *
 * The billing page already carries the meter, but a merchant adding a product
 * has no reason to be on the billing page, so the warning that lived only there
 * reached them exactly never. The backend refuses the upload at 100%
 * (`assertStorageHeadroom`), and the whole point of the 80% threshold is that
 * the refusal should not be the first they hear of it: storage is the one cap
 * they cannot free in the moment, because clearing it means finding and
 * deleting another product's photos.
 * See the backend's `docs/plan/storage-metering.md`.
 *
 * Inline and text-only, following `ImageRatioWarning` — the house pattern for a
 * notice attached to a field. What differs is the colour, and it earns the
 * difference: amber still means "this is fine but you should know", while the
 * full state is not fine at all — that upload WILL be refused, and dressing it
 * as advice would be a lie the merchant discovers by wasting their time.
 *
 * Renders nothing at all unless there is something to say: under 80%, on a plan
 * with no storage ceiling, or whenever usage cannot be read (`known: false` —
 * see `useStorageLimit`, which never degrades to a false alarm).
 */
export function StorageNotice() {
  const t = useTranslations("common.storage");
  const canManageBilling = useCanManageBilling();
  const { usedBytes, limitBytes, ratio, atLimit, nearLimit, known } =
    useStorageLimit();

  // `!known` is deliberately redundant: `useStorageLimit` already gates both
  // flags on it, so either check alone is sufficient (a mutation run removing
  // one at a time leaves the tests green, and removing both turns them red).
  // Kept because this component's silence is the thing that must not break, and
  // reading it here means a future change to the hook's flags cannot quietly
  // turn a cached, unreadable figure into a warning.
  if (!known || (!atLimit && !nearLimit)) return null;

  const Icon = atLimit ? AlertCircle : HardDrive;
  const remaining =
    limitBytes === undefined || usedBytes === undefined
      ? 0
      : Math.max(limitBytes - usedBytes, 0);

  return (
    <p
      role="status"
      className={`flex flex-wrap items-start gap-1.5 text-xs leading-snug ${
        atLimit ? "text-destructive" : "text-amber-600 dark:text-amber-400"
      }`}
    >
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        {atLimit
          ? t("full")
          : t("nearlyFull", {
              percent: Math.round((ratio ?? 0) * 100),
              remaining: formatBytes(remaining),
            })}{" "}
        {/* Only offered to someone who can act on it — everyone else gets the
            fact without a link into a page that will refuse them. */}
        {canManageBilling ? (
          <Link
            href="/dashboard/billing"
            className="font-medium underline underline-offset-2"
          >
            {t("upgrade")}
          </Link>
        ) : null}
      </span>
    </p>
  );
}
