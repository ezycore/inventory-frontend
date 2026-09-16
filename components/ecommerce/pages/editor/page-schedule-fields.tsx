"use client";
// coding-standard: maintained

import { useStorefrontPages } from "@/services/api";
import { DatePicker } from "@/ui/components/date-picker";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import type { PageAfterEnd, ScheduleDraft } from "../page-schedule";

const AFTER_END_OPTIONS: { value: PageAfterEnd; label: string; description: string }[] = [
  { value: "not-found", label: "Show “page not found”", description: "As if the page had never been published." },
  { value: "home", label: "Go to your homepage", description: "Shoppers from an old ad still land in your shop." },
  { value: "page", label: "Go to another page", description: "Your next offer, or a page about it." },
];

/** A date and a time, side by side — one moment of the schedule. */
function Moment({
  id,
  label,
  date,
  time,
  onChange,
}: {
  id: string;
  label: string;
  date: string;
  time: string;
  onChange: (next: { date: string; time: string }) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`${id}-date`}>{label}</Label>
      <div className="flex gap-2">
        <DatePicker
          id={`${id}-date`}
          date={date || undefined}
          onSelect={(value) => onChange({ date: value ?? "", time: value ? time : "" })}
          placeholder="No date"
          className="flex-1"
        />
        {/* Native on purpose: the shared primitives are `DatePicker` (days) and
            `NumberField`; there is no time-of-day field to reuse, and an offer's
            end is a clock time, not only a day. */}
        <Input
          id={`${id}-time`}
          type="time"
          aria-label={`${label} time`}
          value={time}
          disabled={!date}
          onChange={(event) => onChange({ date, time: event.target.value })}
          className="w-32"
        />
      </div>
    </div>
  );
}

/**
 * Mounted only once "Go to another page" is chosen, so the page list is not
 * fetched for every opening of Page settings. Newest first, as the list shows
 * them; a store with more than a hundred pages finds its recent ones here.
 */
function AfterEndPagePicker({
  pageId,
  value,
  onChange,
}: {
  pageId: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const { data } = useStorefrontPages({ limit: 100 });
  const options = (data?.items ?? [])
    .filter((page) => page._id !== pageId && (page.kind === "landing" || page.kind === "content"))
    .map((page) => ({
      value: page._id,
      label: page.title,
      description: page.slug ? `/pages/${page.slug}` : undefined,
    }));
  return (
    <div className="space-y-1.5">
      <Label htmlFor="page-after-end-page">Page to send shoppers to</Label>
      <SimpleSelect
        id="page-after-end-page"
        value={value || undefined}
        options={options}
        placeholder="Choose a page"
        emptyMessage="No other pages yet"
        onValueChange={onChange}
      />
      <p className="text-xs text-muted-foreground">
        If that page is not live when a shopper arrives, they see “page not found”.
      </p>
    </div>
  );
}

/**
 * A landing page's schedule in Page settings: when the offer starts, when it
 * ends, and what its address does after the end. Controlled — the dialog owns
 * the draft and saves it with the rest of the page's settings.
 */
export function PageScheduleFields({
  pageId,
  value,
  onChange,
  problem,
}: {
  pageId: string;
  value: ScheduleDraft;
  onChange: (next: ScheduleDraft) => void;
  problem: string | null;
}) {
  return (
    <div className="space-y-3 border-t pt-4">
      <div>
        <h3 className="text-sm font-semibold">Schedule</h3>
        <p className="text-xs text-muted-foreground">
          For an offer: the page is open to shoppers only between these times, in your device&apos;s time. Leave
          both empty to keep it open. A change can take up to 5 minutes to reach shoppers.
        </p>
      </div>
      <Moment
        id="page-starts"
        label="Starts"
        date={value.startDate}
        time={value.startTime}
        onChange={({ date, time }) => onChange({ ...value, startDate: date, startTime: time })}
      />
      <Moment
        id="page-ends"
        label="Ends"
        date={value.endDate}
        time={value.endTime}
        onChange={({ date, time }) => onChange({ ...value, endDate: date, endTime: time })}
      />
      {value.endDate ? (
        <div className="space-y-1.5">
          <Label htmlFor="page-after-end">After it ends</Label>
          <SimpleSelect
            id="page-after-end"
            value={value.afterEnd}
            options={AFTER_END_OPTIONS}
            onValueChange={(next) => onChange({ ...value, afterEnd: next as PageAfterEnd })}
          />
        </div>
      ) : null}
      {value.endDate && value.afterEnd === "page" ? (
        <AfterEndPagePicker
          pageId={pageId}
          value={value.afterEndPageId}
          onChange={(next) => onChange({ ...value, afterEndPageId: next })}
        />
      ) : null}
      {problem ? <p className="text-sm text-destructive">{problem}</p> : null}
    </div>
  );
}
