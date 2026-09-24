"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useNotificationSettings, useSaveSmsStoreName } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

/**
 * The name every SMS signs with (backend `docs/plan/sms-template-editor.md`
 * §4.3). The sender is the platform's bare number, so this name is the only
 * thing telling a customer who texted them — and it must be English letters,
 * because one Bangla letter makes every message cost two.
 *
 * The server resolves it (the merchant's own → the store name if already
 * English and short → the shop address) and says where it came from. A name
 * taken from the shop address was never chosen by anyone, so the field says so
 * and asks the merchant to check it. The server also validates; this component
 * only shows what it answered.
 */
export function SmsStoreNameField() {
  const t = useTranslations("settings.notifications.smsEditor.storeName");
  const { data } = useNotificationSettings();
  const save = useSaveSmsStoreName();

  // `null` = untouched, so the field shows the server's value; once the user
  // types, the local string wins (same pattern as the recipients card).
  const [edit, setEdit] = useState<string | null>(null);
  const resolved = data?.sms.smsStoreName;
  const value = edit ?? resolved?.name ?? "";
  const custom = data?.sms.storeName;

  const submit = (storeName: string | null) =>
    save.mutate(
      { sms: { storeName } },
      { onSuccess: () => setEdit(null) },
    );

  if (!resolved) return null;

  const source =
    resolved.source === "custom"
      ? t("custom")
      : resolved.source === "slug"
        ? t("fromSlug")
        : t("fromDisplay");

  return (
    <div className="space-y-1.5 rounded-md border px-3 py-2.5">
      <Label htmlFor="sms-store-name">{t("title")}</Label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="sms-store-name"
          value={value}
          maxLength={20}
          className="sm:max-w-xs"
          onChange={(event) => setEdit(event.target.value)}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="h-9"
            disabled={
              save.isPending || edit === null || edit.trim() === resolved.name
            }
            onClick={() => submit(value.trim())}
          >
            {t("save")}
          </Button>
          {custom && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9"
              disabled={save.isPending}
              onClick={() => submit(null)}
            >
              {t("useAutomatic")}
            </Button>
          )}
        </div>
      </div>
      <p
        className={
          resolved.source === "slug"
            ? "text-xs text-amber-700 dark:text-amber-300"
            : "text-xs text-muted-foreground"
        }
      >
        {source}
      </p>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
    </div>
  );
}
