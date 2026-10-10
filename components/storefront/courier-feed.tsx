"use client";
// coding-standard: maintained

import { useStorefrontUI } from "@/services/storefront/ui-context";
import { courierGroupLabel, courierStatusPresentation } from "@/lib/courier-status";
import { dateTime } from "@/components/storefront/format";

/** One entry of a parcel's progress feed, as the buyer-facing payloads carry it. */
export interface CourierFeedEvent {
  status: string;
  label?: string;
  group?: string;
  at?: string;
  /** The return leg (G15) — a refused parcel coming back is not "On the way". */
  returnStage?: string;
}

/**
 * The parcel's progress feed, grouped under the carrier's own phase headings.
 *
 * Shared by the two buyer-facing surfaces — the signed-in account view
 * (`CourierProgress`) and the tokenized tracking link a guest follows — because
 * the same feed on two pages is one component, not two. The account view wraps it
 * with the status chip and the carrier's tracking link; the tracking page puts it
 * inside its own courier card.
 *
 * **Grouping applies only where the provider groups.** Consecutive events sharing
 * a heading collapse under one rail dot, which is what makes it read like the
 * carrier's own page; an event with NO heading starts its own row. That second
 * half is not a detail: `undefined === undefined` compares equal, so grouping
 * ungrouped events would fold a whole Steadfast or manual feed under a single dot
 * wearing the tone of whichever event came last. The admin timeline shipped
 * exactly that bug, and only a browser caught it.
 *
 * **Newest first**, matching the admin `CourierTimeline`: on a phone the latest
 * update is what the shopper came for, and it must not sit below a dozen older
 * rows. Grouping runs on the stored ascending order, then groups and their events
 * are flipped for display.
 *
 * The event sentences are the courier's free text — hub and rider names — so they
 * stay in the provider's English for every reader; the phase heading is a closed
 * vocabulary and IS translated (`courierGroupLabel`).
 */
export function CourierFeed({ history }: { history: CourierFeedEvent[] }) {
  const { t, lang } = useStorefrontUI();
  const bn = lang === "bn";

  const groups: { name?: string; events: CourierFeedEvent[] }[] = [];
  for (const event of history) {
    const last = groups[groups.length - 1];
    if (event.group && last && last.name === event.group) last.events.push(event);
    else groups.push({ name: event.group, events: [event] });
  }

  if (!groups.length) return null;

  const display = groups
    .map((group) => ({
      name: group.name,
      // A phase is however it ended up, so the heading takes its tone from the
      // chronologically LAST event under it — resolved before the flip.
      tone: courierStatusPresentation(
        group.events[group.events.length - 1]?.status,
        group.events[group.events.length - 1]?.returnStage,
      )
        .tone,
      events: [...group.events].reverse(),
    }))
    .reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        }}
      >
        {t.deliveryUpdates}
      </span>

      {display.map((group, gi) => {
        const tone = group.tone;
        const isLast = gi === display.length - 1;

        return (
          <div key={gi} style={{ display: "flex", gap: 7 }}>
            {/* Rail: one dot per phase, joined to the next by a hairline. */}
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: "none",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: tone,
                  marginTop: 5,
                }}
              />
              {!isLast ? (
                <span
                  style={{
                    width: 1,
                    flex: 1,
                    background: "var(--border)",
                    marginTop: 3,
                  }}
                />
              ) : null}
            </span>

            <span
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                paddingBottom: isLast ? 0 : 8,
              }}
            >
              {group.name ? (
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: tone,
                    lineHeight: 1.3,
                  }}
                >
                  {courierGroupLabel(group.name, bn)}
                </span>
              ) : null}

              {group.events.map((entry, i) => {
                const ep = courierStatusPresentation(entry.status, entry.returnStage);
                return (
                  <span
                    key={i}
                    style={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}
                  >
                    {/* The carrier's own sentence when there is one ("Received at
                        pickup hub: Rayerbag.") — it says more than our normalized
                        label ever can. The label is the fallback, which is what a
                        manual courier's feed and a status-only push produce, and
                        it is the only half we can translate. */}
                    <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
                      {entry.label || ep.shopper[bn ? "bn" : "en"]}
                    </span>
                    {entry.at ? (
                      <span style={{ fontSize: 10, color: "var(--faint)" }}>
                        {dateTime(entry.at, t.langCode)}
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
