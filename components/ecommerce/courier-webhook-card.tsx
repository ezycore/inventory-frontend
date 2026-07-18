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

// eCourier has no documented push — it stays on the 30-min poll — so only the
// providers that support webhooks are surfaced here.
const WEBHOOK_PROVIDERS = ["pathao", "steadfast"] as const;
const PROVIDER_LABEL: Record<string, string> = {
  pathao: "Pathao",
  steadfast: "Steadfast",
};

/**
 * The store's delivery-status webhook URLs. The merchant pastes the matching URL
 * into each provider's panel so status updates arrive in real time (the poll is
 * still the fallback). The URL path carries a secret token — regenerating it
 * invalidates the URLs already registered.
 */
export function CourierWebhookCard() {
  const { data, isLoading } = useCourierWebhook();
  const regenerate = useRegenerateWebhookToken();

  const urls = (data?.data?.urls ?? {}) as Record<string, string>;

  const copy = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => toast.success("Webhook URL copied"),
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
          Paste the matching URL into each courier&apos;s webhook setting to get
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
              <div key={p} className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  {PROVIDER_LABEL[p]} webhook URL
                </Label>
                <div className="flex gap-2">
                  <Input readOnly value={urls[p] ?? ""} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label={`Copy ${PROVIDER_LABEL[p]} URL`}
                    disabled={!urls[p]}
                    onClick={() => copy(urls[p])}
                  >
                    <Copy />
                  </Button>
                </div>
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
