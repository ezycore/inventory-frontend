// coding-standard: maintained
import type { AdminStorefrontOrder } from "@/services/api";
import { courierStatusPresentation } from "@/lib/courier-status";
import { longDate } from "./order-detail-helpers";

type CourierEvent = NonNullable<
  NonNullable<AdminStorefrontOrder["courier"]>["history"]
>[number];

/**
 * The parcel's progress feed, rendered the way the carrier's own panel renders it.
 *
 * The backend stores one entry per **provider event** rather than per status
 * change, so this is the surface where that pays off: Pathao's five consecutive
 * `in_transit` events (picked → sorting hub → in transit → last-mile hub →
 * assigned for delivery) are five rows here, each with the carrier's own sentence
 * — hub name, rider name, a weight correction. Before, a merchant saw one line
 * saying "In transit" and had to open the courier's website to learn anything.
 *
 * **Descending, newest first.** A Pathao feed runs to a dozen events, and the one
 * a merchant opens the order for is the latest — oldest-first pushed it below the
 * fold on a phone. The shopper's feed (`CourierFeed`) uses the same order, and the
 * manual-courier panel frames this as "progress your customer sees", so the two
 * screens must never read in opposite directions: change both or neither.
 */
export function CourierTimeline({
  history,
  emptyHint,
}: {
  history: CourierEvent[];
  /** Shown instead of the feed when there is nothing yet. */
  emptyHint?: string;
}) {
  if (!history.length) {
    return emptyHint ? (
      <p className="text-xs text-muted-foreground">{emptyHint}</p>
    ) : null;
  }

  // Consecutive events sharing a heading collapse under it, which is what makes
  // this read like the carrier's panel. Only Pathao sends `group` today.
  //
  // An event with NO group starts its own row — it does not join the previous
  // one. Grouping ungrouped events together looked right in code and wrong on
  // screen: a Steadfast or manual feed has `group === undefined` throughout, so
  // every event collapsed into one bucket and the whole feed rendered under a
  // single dot, with the tone of whichever event happened to be last.
  const groups: { name?: string; events: CourierEvent[] }[] = [];
  for (const event of history) {
    const last = groups[groups.length - 1];
    if (event.group && last && last.name === event.group) last.events.push(event);
    else groups.push({ name: event.group, events: [event] });
  }

  // Grouped in stored (ascending) order above, then flipped for display: groups
  // AND the events inside each one, so the newest event is the first row.
  const display = groups
    .map((group) => ({
      name: group.name,
      // The group's tone follows its chronologically LAST event: a heading is a
      // phase, and the phase is however it ended up.
      tone: courierStatusPresentation(group.events[group.events.length - 1]?.status)
        .tone,
      events: [...group.events].reverse(),
    }))
    .reverse();

  return (
    <div className="flex flex-col">
      {display.map((group, gi) => {
        const isLastGroup = gi === display.length - 1;
        const tone = group.tone;

        return (
          <div key={gi} className="flex gap-3">
            {/* Rail: a dot per group, joined by a line except after the last. */}
            <div className="flex flex-none flex-col items-center">
              <div
                className="mt-1.5 size-2.5 rounded-full"
                style={{ background: tone }}
              />
              {!isLastGroup && <div className="w-px flex-1 bg-border" />}
            </div>

            <div className={isLastGroup ? "min-w-0 flex-1" : "min-w-0 flex-1 pb-4"}>
              {group.name ? (
                <div className="text-sm font-semibold" style={{ color: tone }}>
                  {group.name}
                </div>
              ) : null}

              {group.events.map((event, i) => {
                const presentation = courierStatusPresentation(event.status);
                return (
                  <div
                    key={i}
                    className={group.name || i > 0 ? "mt-1.5" : undefined}
                    // The provider's raw event id — useless to a merchant, but the
                    // first thing anyone debugging a feed wants, and free here.
                    title={event.code ?? undefined}
                  >
                    {/* The carrier's own sentence when there is one; our normalized
                        label otherwise, which is what a manual courier and a
                        status-only push produce. */}
                    <div className="text-sm">
                      {event.label || presentation.admin}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {event.at ? longDate(String(event.at)) : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
