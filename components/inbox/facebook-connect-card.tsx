"use client";
// coding-standard: maintained

import { useStartInboxOAuth } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Facebook } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * "Connect with Facebook" (backend plan D2b) — shown only when the backend says
 * `oauthAvailable`. One click: the merchant logs in on Facebook, picks a Page, and ezycore
 * subscribes it. Nothing to copy, no Meta app of their own.
 */
export function FacebookConnectCard({ reconnect = false }: { reconnect?: boolean }) {
  const t = useTranslations("inbox.settings.oauth");
  const start = useStartInboxOAuth();

  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold">{reconnect ? t("reconnectTitle") : t("title")}</h2>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <Button onClick={() => start.mutate()} disabled={start.isPending || start.isSuccess}>
        <Facebook className="h-4 w-4" />
        {start.isPending || start.isSuccess ? t("redirecting") : t("button")}
      </Button>
    </Card>
  );
}
