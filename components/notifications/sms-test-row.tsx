"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { useState } from "react";
import { useSendSmsTest } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

/**
 * The SMS self-test — one real, charged message, and the only way to find out
 * whether the gateway credentials work without waiting for a customer order.
 *
 * The number is shown and editable, which is the whole point of this row.
 * Before, the button sent to the configured alert number with nothing on screen
 * naming it: a merchant pressed it, was charged a segment, and had no way to
 * tell which phone should have buzzed — or that the field was empty and the
 * press would 400. The backend has always accepted a per-send `phone`
 * override; it just had no control.
 *
 * The override is deliberately NOT saved to `merchantRecipients`. A merchant
 * fixing a wrong number wants to prove the new one works first, and a test that
 * quietly rewrote their alert number would make the proof and the commitment
 * the same irreversible act.
 */
export function SmsTestRow({
  alertPhone,
  disabled,
}: {
  /** The configured alert number, used as the prefill. */
  alertPhone: string;
  /** No balance, or credit expired — nothing to spend on a test. */
  disabled: boolean;
}) {
  const t = useTranslations("settings.notifications");
  const sendTest = useSendSmsTest();
  // `null` = untouched, so the field tracks the saved alert number until the
  // merchant types — the same derivation the recipients card uses.
  const [phoneEdit, setPhoneEdit] = useState<string | null>(null);
  const phone = phoneEdit ?? alertPhone;
  // A rejection comes back as a successful response carrying the gateway's
  // reason, so the verdict is read off `data`, not off the error.
  const verdict = sendTest.data?.data;

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="sms-test-phone">{t("sms.testTo")}</Label>
          <Input
            id="sms-test-phone"
            className="w-48"
            value={phone}
            placeholder="01XXXXXXXXX"
            onChange={(e) => setPhoneEdit(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          // An empty number is a guaranteed 400, so the button says so by
          // being unavailable rather than by spending a round trip to fail.
          disabled={sendTest.isPending || disabled || phone.trim() === ""}
          onClick={() => sendTest.mutate(phone.trim())}
        >
          <Send className="size-3.5" />
          {sendTest.isPending ? t("sms.testSending") : t("sms.test")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("sms.testHint")}</p>
      {/* The gateway's own words on a rejection — the reason the button
          exists. A generic "failed" would send the merchant to support with
          nothing to say. */}
      {verdict && (
        <p
          className={
            verdict.status === "sent"
              ? "text-xs text-emerald-600 dark:text-emerald-400"
              : "text-xs text-destructive"
          }
        >
          {verdict.status === "sent"
            ? t("sms.testSent", { recipient: verdict.recipient })
            : verdict.error || t("sms.testFailed")}
        </p>
      )}
    </div>
  );
}
