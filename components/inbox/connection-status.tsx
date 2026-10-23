"use client";
// coding-standard: maintained

import { useFormatters } from "@/hooks/use-formatters";
import { useDisconnectInbox, useTestInboxConnection, type InboxConnection } from "@/services/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/ui/components/alert-dialog";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { CopyField } from "@/ui/components/copy";
import { cn } from "@/ui/lib/utils";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * A saved connection: is it working, and what to paste into Meta. `webhookVerifiedAt` is the
 * proof the Callback URL was pasted right — Facebook stamps it the moment it calls us.
 */
export function ConnectionStatus({ connection }: { connection: InboxConnection }) {
  const t = useTranslations("inbox.settings");
  const { formatDateTime } = useFormatters();
  const test = useTestInboxConnection();
  const disconnect = useDisconnectInbox();
  const healthy = connection.status === "active";
  // Connected through ezycore's app: ezycore subscribed the Page, so there is nothing to paste.
  const platform = connection.source === "platform";

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{t("statusTitle")}</h2>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              healthy
                ? "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300"
                : "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
            )}
          >
            {healthy ? <CircleCheck className="h-3.5 w-3.5" /> : <TriangleAlert className="h-3.5 w-3.5" />}
            {connection.status ? t(`status.${connection.status}`) : null}
          </span>
        </div>
        {connection.statusReason && <p className="text-sm text-amber-800 dark:text-amber-300">{connection.statusReason}</p>}
        <dl className="grid gap-1 text-sm sm:grid-cols-[140px_1fr]">
          <dt className="text-muted-foreground">{t("page")}</dt>
          <dd>{connection.pageName ? `${connection.pageName} · ${connection.pageId}` : connection.pageId}</dd>
          <dt className="text-muted-foreground">{t("connectedVia")}</dt>
          <dd>{platform ? t("viaFacebook") : t("viaOwnApp")}</dd>
        </dl>
        <p className="text-xs text-muted-foreground">
          {connection.lastVerifiedAt && t("lastChecked", { time: formatDateTime(connection.lastVerifiedAt) })}
          {" · "}
          {connection.lastEventAt ? t("lastEvent", { time: formatDateTime(connection.lastEventAt) }) : t("noEventYet")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => test.mutate()} disabled={test.isPending}>
            {t("test")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive">
                {t("disconnect")}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("disconnectTitle")}</AlertDialogTitle>
                <AlertDialogDescription>{t("disconnectDescription")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                <AlertDialogAction onClick={() => disconnect.mutate()}>{t("disconnect")}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {!platform && <Card className="space-y-3 p-5">
        <h2 className="font-semibold">{t("webhookTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("webhookHint")}</p>
        <dl className="space-y-2 text-sm">
          <CopyRow label={t("callbackUrl")} value={connection.webhookUrl} />
          <CopyRow label={t("verifyToken")} value={connection.verifyToken} />
        </dl>
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm",
            connection.webhookVerifiedAt ? "text-green-700 dark:text-green-400" : "text-muted-foreground",
          )}
        >
          {connection.webhookVerifiedAt ? <CircleCheck className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
          {connection.webhookVerifiedAt ? t("webhookVerified") : t("webhookNotVerified")}
        </p>
        <p className="text-sm text-muted-foreground">{t("subscribeHint")}</p>
      </Card>}
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-all rounded-md bg-muted px-2 py-1.5 font-mono text-xs">
        <CopyField value={value} />
      </dd>
    </div>
  );
}
