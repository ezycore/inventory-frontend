"use client";
// coding-standard: maintained

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StorefrontApiError, storefrontApi } from "@/lib/storefront-client";
import { storefront } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";
import { storeHref } from "@/lib/storefront-links";
import { SkeletonLine } from "@/components/storefront/sf-skeleton";
import { ghostBtn } from "@/components/storefront/checkout/checkout-bits";
import {
  TrackedOrderPanel,
  trackStyles,
} from "@/components/storefront/tracked-order-panel";

/**
 * Public order tracking — the page a tracking link opens.
 *
 * **No login, no form, and nothing to act on.** The token in the URL is the whole
 * credential, exactly as a courier's tracking link works: scoped to one order,
 * read-only, and revealing nothing the buyer does not already know. The server
 * projects an allowlist, so this page cannot render a merchant's cost or ledger
 * refs even if the model grows them later.
 *
 * For a guest this is the ONLY place their order exists to them — no SMS carries
 * the link (the merchant sends it), and they have no account to sign into. So the
 * failure state matters as much as the success one: a dead link has to say what
 * to do next rather than 404 into a void.
 *
 * The order itself renders through `TrackedOrderPanel`, shared with the lost-link
 * lookup so the two entry points cannot drift into different screens.
 */

const { wrap, card, row, muted } = trackStyles;

/** A `label ………… value` placeholder pair, matching `row` above. */
function SkeletonRow({
  label,
  value,
}: {
  label: number | string;
  value: number | string;
}) {
  return (
    <div style={row}>
      <SkeletonLine width={label} />
      <SkeletonLine width={value} />
    </div>
  );
}

/**
 * Built from the same `wrap`/`card`/`row` constants the real page uses, so the
 * shapes cannot drift apart and nothing jumps when the data lands. A reload of a
 * tracking link is a cold fetch with no cached anything, so this is the first
 * thing the buyer sees — it should look like their order arriving, not like the
 * page is broken.
 */
function TrackSkeleton({ label }: { label: string }) {
  return (
    <div style={wrap} role="status" aria-label={label}>
      <SkeletonLine width={168} height={22} radius={7} style={{ marginBottom: 10 }} />
      <SkeletonLine width={224} style={{ marginBottom: 22 }} />

      <div style={card}>
        <SkeletonRow label="52%" value={58} />
        <SkeletonRow label="44%" value={58} />
        <SkeletonRow label="36%" value={52} />
        <SkeletonRow label="30%" value={64} />
      </div>

      <div style={card}>
        <SkeletonLine width={82} style={{ marginBottom: 12 }} />
        <SkeletonRow label="38%" value={104} />
        <SkeletonRow label="30%" value={104} />
      </div>

      <SkeletonLine width="58%" />
    </div>
  );
}

export default function View() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const params = useParams<{ token: string }>();
  const token = String(params?.token ?? "");

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: storefront.trackedOrder(slug, token),
    queryFn: () => storefrontApi.trackOrder(slug, token),
    enabled: !!slug && !!token,
    // A tracking link is opened repeatedly while a parcel is in transit; there is
    // no session to invalidate against, so just keep it briefly fresh.
    staleTime: 30_000,
    // Retry what a retry can fix. A 404 is the server's settled answer and
    // asking again only delays the buyer's screen; a 5xx or a dropped mobile
    // connection is exactly what one more attempt resolves. 429 is excluded on
    // purpose — retrying a throttle is what earned the throttle.
    retry: (count, err) => {
      const status = err instanceof StorefrontApiError ? err.status : 0;
      if (status === 404 || status === 429) return false;
      return count < 2;
    },
  });

  if (isPending) return <TrackSkeleton label={t.loading} />;

  if (isError || !data) {
    // Three failures, three answers. Sending a buyer with a WORKING link to the
    // merchant for a replacement is the expensive mistake here — the merchant
    // cannot reproduce it, so it becomes a support ticket nobody can close. Only
    // a 404 means the link is actually dead (the server answers unknown and
    // expired identically, so this copy covers both without guessing).
    const status = error instanceof StorefrontApiError ? error.status : 0;
    const dead = status === 404;
    const throttled = status === 429;
    const title = dead
      ? t.trackDeadTitle
      : throttled
        ? t.trackThrottledTitle
        : t.trackFailedTitle;
    const body = dead
      ? t.trackDeadBody
      : throttled
        ? t.trackThrottledBody
        : t.trackFailedBody;

    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
          <div style={muted}>{body}</div>
          <div style={{ marginTop: 12 }}>
            {/* The recovery lookup only helps when the link is genuinely dead —
                offering it for a throttle or an outage sends the buyer to a
                second form that will fail for the same reason. */}
            {dead ? (
              <Link href={storeHref(base, "/orders/track")} style={{ textDecoration: "underline" }}>
                {t.trackLookUpOrder}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                style={{ ...ghostBtn, opacity: isFetching ? 0.6 : 1 }}
              >
                {isFetching ? t.loading : t.tryAgain}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <TrackedOrderPanel order={data} />;
}
