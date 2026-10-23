"use client";
// coding-standard: maintained

import { useConnectInboxOAuthPage, useInboxOAuthPages } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Skeleton } from "@/ui/components/skeleton";
import { useTranslations } from "next-intl";

/**
 * Back from Facebook: the Pages this sign-in may connect. `grant` is the encrypted blob the
 * backend put in the URL fragment — this component only hands it back; it never sees a token.
 * A Page whose Facebook role cannot answer messages is listed but not connectable, so the
 * merchant knows why it is missing rather than wondering.
 */
export function FacebookPagePicker({ grant, onDone }: { grant: string; onDone: () => void }) {
  const t = useTranslations("inbox.settings.oauth");
  const pages = useInboxOAuthPages(grant);
  const connect = useConnectInboxOAuthPage();

  return (
    <Card className="space-y-3 p-5">
      <h2 className="font-semibold">{t("pickTitle")}</h2>
      <p className="text-sm text-muted-foreground">{t("pickHint")}</p>

      {pages.isLoading && <Skeleton className="h-24 w-full" />}
      {pages.isError && <p className="text-sm text-destructive">{t("expired")}</p>}
      {pages.data?.length === 0 && <p className="text-sm text-muted-foreground">{t("noPages")}</p>}

      {pages.data && pages.data.length > 0 && (
        <ul className="divide-y rounded-md border">
          {pages.data.map((page) => (
            <li key={page.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium">{page.name ?? page.id}</p>
                <p className="text-xs text-muted-foreground">
                  {page.canMessage ? page.id : t("cannotMessage")}
                </p>
              </div>
              <Button
                size="sm"
                disabled={!page.canMessage || connect.isPending}
                onClick={() => connect.mutate({ grant, pageId: page.id }, { onSuccess: onDone })}
              >
                {connect.isPending && connect.variables?.pageId === page.id ? t("connecting") : t("connect")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="ghost" size="sm" onClick={onDone}>
        {t("cancel")}
      </Button>
    </Card>
  );
}
