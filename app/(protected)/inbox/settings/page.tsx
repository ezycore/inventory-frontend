"use client";
// coding-standard: maintained

import { AiCreditCard } from "@/components/inbox/ai-credit-card";
import { AiCreditHistory } from "@/components/inbox/ai-credit-history";
import { AiFlagsCard } from "@/components/inbox/ai-flags-card";
import { AiSettingsCard } from "@/components/inbox/ai-settings-card";
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
  // The shell renders this page only after hydration, so the hash can be read on the first render.
  const [oauthReturn] = useState(() => readOAuthReturn(window.location.hash));
  const [grant, setGrant] = useState<string | null>(oauthReturn?.grant ?? null);

  useEffect(() => {
    if (!oauthReturn) return;
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (oauthReturn.error) toast.error(t(`oauth.errors.${oauthReturn.error}`));
  }, [oauthReturn, t]);

  const oauth = Boolean(connection?.oauthAvailable);
  const platform = connection?.connected && connection.source === "platform";
  // Offer the button unless the Page is already connected with Facebook. A broken one ("needs
  // attention", e.g. removed in Facebook settings) gets its reconnect button on the connection card
  // itself — down here, below the AI cards, merchants did not find it (live test 2026-10-25).
  const offerFacebook = oauth && !grant && !platform;

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
          {connection?.connected && (
            <AiSettingsCard
              key={`${connection.aiEnabled}-${connection.holdingMessage}-${connection.handoverIdleMinutes}`}
              connection={connection}
            />
          )}
          {/* Only once the AI could run here — a shop without a Page has nothing to spend it on. */}
          {connection?.connected && connection.aiAvailable && <AiCreditCard />}
          {connection?.connected && connection.aiAvailable && <AiCreditHistory />}
          {connection?.connected && connection.aiAvailable && <AiFlagsCard />}
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
