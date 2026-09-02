"use client";
// coding-standard: maintained

import { Copy, RefreshCw, Webhook } from "lucide-react";
import { toast } from "sonner";
import { useCourierWebhook, useRegenerateWebhookToken } from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Spinner } from "@/ui/components/spinner";
import { copyText } from "@/utils/clipboard";

// eCourier has no documented push — it stays on the 30-min poll — so only the
// providers that support webhooks are surfaced here.
const WEBHOOK_PROVIDERS = ["pathao", "steadfast"] as const;
const PROVIDER_LABEL: Record<string, string> = {
  pathao: "Pathao",
  steadfast: "Steadfast",
};

/**
 * What the merchant must type into the provider panel's second field. Neither
 * panel will save an integration with it blank, and the two providers mean
 * different things by it — so the hint is per provider, not a shared sentence.
 */
const SECRET_LABEL: Record<string, string> = {
  pathao: "Secret",
  steadfast: "Auth Token (Bearer)",
};
const SECRET_HINT: Record<string, string> = {
  pathao:
    "Paste this exact value — Pathao checks that our endpoint echoes it back, and a different value can make it reject the callback URL.",
  steadfast: "This store's own token. Regenerating below replaces it.",
};

/**
 * The store's delivery-status webhook credentials. The merchant pastes the
 * matching URL *and* secret into each provider's panel so status updates arrive
 * in real time (the poll is still the fallback). The URL path carries a secret
 * token — regenerating it invalidates what is already registered, both values.
 */
export function CourierWebhookCard() {
  const { data, isLoading } = useCourierWebhook();
  const regenerate = useRegenerateWebhookToken();

  const urls = (data?.data?.urls ?? {}) as Record<string, string>;
  const secrets = (data?.data?.secrets ?? {}) as Record<string, string | null>;

  const copy = (value: string, what: string) => {
    copyText(value).then(
      () => toast.success(`${what} copied`),
      () => toast.error("Could not copy"),
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="size-4" />
          Delivery status webhook
          <span className="text-xs font-normal text-muted-foreground">
            (optional)
          </span>
        </CardTitle>
        <CardDescription>
          Paste both values into each courier&apos;s webhook setting to get
          real-time status updates. Without it, statuses still refresh
          automatically every 30 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner /> Loading…
          </p>
        ) : (
          <>
            {WEBHOOK_PROVIDERS.map((p) => (
              <div key={p} className="flex flex-col gap-2 rounded-lg border p-3">
                <p className="text-sm font-semibold">{PROVIDER_LABEL[p]}</p>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Callback URL
                  </Label>
                  <div className="flex gap-2">
                    <Input readOnly value={urls[p] ?? ""} className="font-mono text-xs" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Copy ${PROVIDER_LABEL[p]} callback URL`}
                      disabled={!urls[p]}
                      onClick={() => copy(urls[p], "Callback URL")}
                    >
                      <Copy />
                    </Button>
                  </div>
                </div>

                {secrets[p] ? (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {SECRET_LABEL[p]}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        readOnly
                        value={secrets[p] ?? ""}
                        className="font-mono text-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label={`Copy ${PROVIDER_LABEL[p]} ${SECRET_LABEL[p]}`}
                        onClick={() => copy(secrets[p] as string, SECRET_LABEL[p])}
                      >
                        <Copy />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {SECRET_HINT[p]}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                eCourier has no webhook — it is polled automatically.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => regenerate.mutate()}
                disabled={regenerate.isPending}
              >
                {regenerate.isPending ? <Spinner /> : <RefreshCw />}
                Regenerate
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
