"use client";
// coding-standard: maintained

import { ConnectionForm } from "@/components/inbox/connection-form";
import { ConnectionStatus } from "@/components/inbox/connection-status";
import { FacebookConnectCard } from "@/components/inbox/facebook-connect-card";
import { FacebookPagePicker } from "@/components/inbox/facebook-page-picker";
import { readOAuthReturn } from "@/components/inbox/inbox-utils";
import { useHasPermission } from "@/hooks/use-has-permission";
import { useRequireAccess } from "@/hooks/use-require-access";
import { useInboxConnection } from "@/services/api";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/ui/components/collapsible";
import PageHeader from "@/ui/components/header";
import { Skeleton } from "@/ui/components/skeleton";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const STEPS = ["step1", "step2", "step3", "step4", "step5"] as const;

/**
 * Inbox → Settings: connect the Facebook Page (inventory-backend `docs/features/inbox.md`,
 * plan §9, D2b). Needs `inbox.manage` — the route's nav row only asks for `inbox.view`, so
 * this page guards itself.
 *
 * Two ways in, decided by the backend's `oauthAvailable` (an env switch there, so flipping it
 * needs no frontend rebuild):
 * - **On:** "Connect with Facebook" leads; the merchant's own Meta app is folded away below
 *   as the advanced option, still fully usable.
 * - **Off:** the own-app form and its checklist, exactly as before.
 *
 * Coming back from Facebook, the backend's callback lands here with `#oauth=<grant>` (an
 * encrypted blob) or `#oauthError=<code>` in the fragment. It is read once and removed from
 * the address bar straight away, so it never sits in history or a copied link.
 */
export default function InboxSettingsPage() {
  const t = useTranslations("inbox.settings");
  const tShell = useTranslations("settings.shell");
  const canManage = useHasPermission("inbox.manage");
  useRequireAccess([{ allowed: canManage, message: tShell("noPermission") }], "/inbox");
  const { data: connection, isLoading } = useInboxConnection(canManage);
  const [grant, setGrant] = useState<string | null>(null);

  useEffect(() => {
    const result = readOAuthReturn(window.location.hash);
    if (!result) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (result.grant) setGrant(result.grant);
    if (result.error) toast.error(t(`oauth.errors.${result.error}`));
  }, [t]);

  const oauth = Boolean(connection?.oauthAvailable);
  const platform = connection?.connected && connection.source === "platform";
  // Offer the button unless a healthy platform connection is already in place; a broken one
  // ("needs attention", e.g. removed in Facebook settings) is fixed by connecting again.
  const offerFacebook = oauth && !grant && !(platform && connection?.status === "active");

  const ownApp = (
    <>
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
  );

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
          {grant && <FacebookPagePicker grant={grant} onDone={() => setGrant(null)} />}
          {connection?.connected && <ConnectionStatus connection={connection} />}
          {offerFacebook && <FacebookConnectCard reconnect={Boolean(connection?.connected)} />}
          {oauth ? (
            // Open by default only for a shop already on its own app — that is their setup.
            <Collapsible defaultOpen={connection?.connected && !platform}>
              <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                <ChevronDown className="h-4 w-4" />
                {t("oauth.ownAppToggle")}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 space-y-6">{ownApp}</CollapsibleContent>
            </Collapsible>
          ) : (
            ownApp
          )}
        </>
      )}
    </div>
  );
}
