"use client";
// coding-standard: maintained

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ui/components/button";
import { Checkbox } from "@ui/components/checkbox";
import { Input } from "@ui/components/input";
import { Password } from "@ui/components/input-password";
import { Label } from "@ui/components/label";
import { useStartWooMigration, type StartWooMigrationInput } from "@/services/api";

type Switch = "autoCreate" | "mirrorImages" | "importOrders";
const SWITCHES: Switch[] = ["autoCreate", "mirrorImages", "importOrders"];

/**
 * Connect a WooCommerce store (backend `docs/plan/data-migration.md` Phase 3).
 * The backend checks the store and the key before it starts anything, so a
 * wrong address or a key without Read permission is answered right here, in
 * the server's own words.
 */
export function WooConnectForm({ onStarted }: { onStarted: (runId: string) => void }) {
  const t = useTranslations("products.products.migrate.form");
  const id = useId();
  const start = useStartWooMigration();
  const [form, setForm] = useState<StartWooMigrationInput>({
    storeUrl: "",
    consumerKey: "",
    consumerSecret: "",
    autoCreate: true,
    mirrorImages: true,
    importOrders: true,
  });

  const set = <K extends keyof StartWooMigrationInput>(key: K, value: StartWooMigrationInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await start.mutateAsync(form);
      if (response.data?._id) onStarted(response.data._id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };

  const ready = form.storeUrl.trim() && form.consumerKey.trim() && form.consumerSecret.trim();

  return (
    <form onSubmit={submit} className="space-y-5 rounded-lg border p-4 sm:p-6">
      <div className="space-y-2">
        <Label htmlFor={`${id}-url`}>{t("storeUrl")}</Label>
        <Input
          id={`${id}-url`}
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder={t("storeUrlPlaceholder")}
          value={form.storeUrl}
          onChange={(e) => set("storeUrl", e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${id}-key`}>{t("consumerKey")}</Label>
          {/* A text field then a password field reads to Chrome as a login, and it
              filled the merchant's own EzyCore email and password in here — "off" is
              ignored for that. "new-password" on the secret is what Chrome honours;
              the data-* attributes keep password managers out too. */}
          <Input
            id={`${id}-key`}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            spellCheck={false}
            placeholder="ck_…"
            value={form.consumerKey}
            onChange={(e) => set("consumerKey", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-secret`}>{t("consumerSecret")}</Label>
          <Password
            id={`${id}-secret`}
            autoComplete="new-password"
            data-1p-ignore
            data-lpignore="true"
            spellCheck={false}
            placeholder="cs_…"
            value={form.consumerSecret}
            onChange={(e) => set("consumerSecret", e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md bg-muted/50 p-3 text-sm">
        <p className="font-medium">{t("keyHelpTitle")}</p>
        <p className="mt-1 text-muted-foreground">{t("keyHelp")}</p>
      </div>

      <div className="space-y-3">
        {SWITCHES.map((key) => (
          <div key={key} className="flex items-start gap-2">
            <Checkbox
              id={`${id}-${key}`}
              className="mt-0.5"
              checked={form[key]}
              onCheckedChange={(checked) => set(key, checked === true)}
            />
            <label htmlFor={`${id}-${key}`} className="min-w-0 cursor-pointer text-sm">
              <span className="font-medium">{t(key)}</span>
              <span className="block text-xs text-muted-foreground">{t(`${key}Hint`)}</span>
            </label>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={!ready || start.isPending}>
        {start.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {start.isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
