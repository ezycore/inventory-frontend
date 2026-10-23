"use client";
// coding-standard: maintained

import { useSaveInboxConnection, type InboxConnection } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Password } from "@/ui/components/input-password";
import { Label } from "@/ui/components/label";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";

/**
 * The three values the merchant pastes from their own Meta app. The backend checks both
 * secrets with Facebook before it saves anything, so a wrong one comes back as an error
 * naming what is wrong — this form only needs to send them.
 *
 * Secrets are never pre-filled (the API never returns them). On an existing connection an
 * empty secret field means "keep the saved one".
 */
export function ConnectionForm({ connection }: { connection?: InboxConnection }) {
  const t = useTranslations("inbox.settings");
  const save = useSaveInboxConnection();
  const connected = Boolean(connection?.connected);
  const [pageId, setPageId] = useState(connection?.pageId ?? "");
  const [pageAccessToken, setPageAccessToken] = useState("");
  const [appSecret, setAppSecret] = useState("");

  const needsSecrets = !connected;
  const ready = /^\d{5,32}$/.test(pageId.trim()) && (!needsSecrets || (pageAccessToken.trim() && appSecret.trim()));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!ready || save.isPending) return;
    save.mutate(
      {
        pageId: pageId.trim(),
        pageAccessToken: pageAccessToken.trim() || undefined,
        appSecret: appSecret.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPageAccessToken("");
          setAppSecret("");
        },
      },
    );
  };

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("pageId")} hint={t("pageIdHint")}>
          {(id) => (
            <Input id={id} value={pageId} onChange={(e) => setPageId(e.target.value)} inputMode="numeric" autoComplete="off" />
          )}
        </Field>
        <Field label={t("token")} hint={t("tokenHint")}>
          {(id) => (
            <Password id={id} value={pageAccessToken} onChange={(e) => setPageAccessToken(e.target.value)} autoComplete="new-password" />
          )}
        </Field>
        <Field label={t("secret")} hint={t("secretHint")}>
          {(id) => (
            <Password id={id} value={appSecret} onChange={(e) => setAppSecret(e.target.value)} autoComplete="new-password" />
          )}
        </Field>
        <Button type="submit" disabled={!ready || save.isPending}>
          {save.isPending ? t("saving") : connected ? t("save") : t("connect")}
        </Button>
      </form>
    </Card>
  );
}

/** Label + control + hint, with the label really pointing at the control (`useId`). */
function Field({ label, hint, children }: { label: string; hint: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
