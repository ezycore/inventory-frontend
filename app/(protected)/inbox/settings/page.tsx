"use client";
// coding-standard: maintained

import { ConnectionForm } from "@/components/inbox/connection-form";
import { ConnectionStatus } from "@/components/inbox/connection-status";
import { useHasPermission } from "@/hooks/use-has-permission";
import { useRequireAccess } from "@/hooks/use-require-access";
import { useInboxConnection } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import PageHeader from "@/ui/components/header";
import { Skeleton } from "@/ui/components/skeleton";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

const STEPS = ["step1", "step2", "step3", "step4", "step5"] as const;

/**
 * Inbox → Settings: connect the merchant's own Facebook Page (inventory-backend
 * `docs/features/inbox.md`, plan §9). Needs `inbox.manage` — the route's nav row only asks
 * for `inbox.view`, so this page guards itself.
 *
 * The setup is technical and usually done with our support on a call; the steps are the
 * same checklist support reads from.
 */
export default function InboxSettingsPage() {
  const t = useTranslations("inbox.settings");
  const tShell = useTranslations("settings.shell");
  const canManage = useHasPermission("inbox.manage");
  useRequireAccess([{ allowed: canManage, message: tShell("noPermission") }], "/inbox");
  const { data: connection, isLoading } = useInboxConnection(canManage);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={t("title")}
        subTitle={t("subtitle")}
        actions={
          <Button variant="ghost" asChild>
            <Link href="/inbox">
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          {connection?.connected && <ConnectionStatus connection={connection} />}
          <ConnectionForm key={connection?.pageId ?? "new"} connection={connection} />
          <Card className="p-5">
            <h2 className="mb-2 font-semibold">{t("stepsTitle")}</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              {STEPS.map((step) => (
                <li key={step}>{t(step)}</li>
              ))}
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}
