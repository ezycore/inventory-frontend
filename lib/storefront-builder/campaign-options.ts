// coding-standard: maintained
import { formatInTimeZone } from "date-fns-tz";
import { resolveTimezone } from "@/lib/org-calendar";

/** The fields of a campaign the picker needs — a subset of `ApiCampaign`. */
export interface CampaignPickerDoc {
  _id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status?: "active" | "inactive";
}

export interface CampaignPickerOption {
  value: string;
  label: string;
  /** An ended or switched-off offer: listed only because it is the one picked. */
  disabled?: boolean;
}

type State = "running" | "upcoming" | "ended" | "off";

const stateOf = (doc: CampaignPickerDoc, now: number): State => {
  if (doc.status === "inactive") return "off";
  if (Date.parse(doc.endsAt) < now) return "ended";
  if (Date.parse(doc.startsAt) > now) return "upcoming";
  return "running";
};

/**
 * The hero's "Which offer" choices.
 *
 * Only an offer that can still show a badge is offered: running, or upcoming —
 * picked ahead, the badge appears by itself when it starts. An ended or
 * switched-off offer can never show one, and listing it beside the rest is how
 * a merchant picked "Eid Sale" three days after it closed and got an empty hero
 * with no reason given. The one exception is the offer ALREADY picked: it stays,
 * labelled with why it shows nothing, and disabled so it cannot be re-picked.
 *
 * Dates print on the organization's calendar, the zone a campaign's whole-day
 * window was set in.
 */
export function campaignPickerOptions(
  docs: readonly CampaignPickerDoc[],
  { now, timezone, pickedId }: { now: number; timezone?: string; pickedId?: string },
): CampaignPickerOption[] {
  const tz = resolveTimezone(timezone);
  const day = (iso: string) => formatInTimeZone(new Date(iso), tz, "d MMM");
  const rank: Record<State, number> = { running: 0, upcoming: 1, ended: 2, off: 3 };

  return docs
    .map((doc) => ({ doc, state: stateOf(doc, now) }))
    .filter(({ doc, state }) => state === "running" || state === "upcoming" || doc._id === pickedId)
    .sort(
      (a, b) =>
        rank[a.state] - rank[b.state] || Date.parse(a.doc.startsAt) - Date.parse(b.doc.startsAt),
    )
    .map(({ doc, state }) => {
      switch (state) {
        case "running":
          return { value: doc._id, label: `${doc.name} · until ${day(doc.endsAt)}` };
        case "upcoming":
          return { value: doc._id, label: `${doc.name} · starts ${day(doc.startsAt)}` };
        case "ended":
          return { value: doc._id, label: `${doc.name} · ended ${day(doc.endsAt)}`, disabled: true };
        case "off":
          return { value: doc._id, label: `${doc.name} · turned off`, disabled: true };
      }
    });
}
