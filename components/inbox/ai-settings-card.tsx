"use client";
// coding-standard: maintained

import { useSaveInboxAiSettings, type InboxConnection } from "@/services/api";
import { useAuthStore } from "@/services/stores/use-auth-store";
import { Button } from "@/ui/components/button";
import { Card } from "@/ui/components/card";
import { Label } from "@/ui/components/label";
import { SimpleSelect } from "@/ui/components/simple-select";
import { Switch } from "@/ui/components/switch";
import { Textarea } from "@/ui/components/textarea";
import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

/** After staff answered: how long they may be quiet before the AI takes the chat back. */
const IDLE_CHOICES = ["0", "15", "30", "60", "240"] as const;

/**
 * AI replies for the connected Page (backend plan Phase 1). The switch only exists to flip when
 * the platform can actually run the AI (`aiAvailable`) — otherwise the card says why there is
 * nothing to switch on, instead of offering a switch that would answer nobody.
 *
 * Switching on starts the AI on NEW chats; chats already with staff stay there until someone
 * clicks "Give back to AI" in the thread — said on the card, because it is the one surprise.
 *
 * Above the merchant's switch sits the workspace's own `aiChat` (Customize workspace, plan-granted):
 * off there, the backend refuses this save and no chat starts with the AI, so the card says where to
 * turn it back on instead of offering a switch that cannot work.
 */
export function AiSettingsCard({ connection }: { connection: InboxConnection }) {
  const t = useTranslations("inbox.settings.ai");
  const save = useSaveInboxAiSettings();
  const aiChatOn = useAuthStore((s) => s.user?.organization?.features?.aiChat) !== false;
  const holdingId = useId();
  const [enabled, setEnabled] = useState(Boolean(connection.aiEnabled));
  const [holding, setHolding] = useState(connection.holdingMessage ?? "");
  const [idle, setIdle] = useState(String(connection.handoverIdleMinutes ?? 30));

  const dirty =
    enabled !== Boolean(connection.aiEnabled) ||
    holding !== (connection.holdingMessage ?? "") ||
    idle !== String(connection.handoverIdleMinutes ?? 30);

  return (
    <Card className="space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <h2 className="font-semibold">{t("title")}</h2>
      </div>

      {!connection.aiAvailable ? (
        <p className="text-sm text-muted-foreground">{t("unavailable")}</p>
      ) : !aiChatOn ? (
        <p className="text-sm text-muted-foreground">{t("workspaceOff")}</p>
      ) : (
        <>
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="block text-sm font-medium">{t("enable")}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t("enableHint")}</span>
            </span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </label>

          <div className="space-y-1.5">
            <Label htmlFor={holdingId}>{t("holding")}</Label>
            <Textarea
              id={holdingId}
              value={holding}
              onChange={(e) => setHolding(e.target.value)}
              maxLength={640}
              rows={2}
              placeholder={t("holdingPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("holdingHint")}</p>
          </div>

          <div className="space-y-1.5">
            <Label>{t("idle")}</Label>
            <SimpleSelect
              value={idle}
              onValueChange={setIdle}
              options={IDLE_CHOICES.map((value) => ({ value, label: t(`idleChoice.${value}`) }))}
            />
            <p className="text-xs text-muted-foreground">{t("idleHint")}</p>
          </div>

          <Button
            disabled={!dirty || save.isPending}
            onClick={() =>
              save.mutate({ aiEnabled: enabled, holdingMessage: holding.trim(), handoverIdleMinutes: Number(idle) })
            }
          >
            {save.isPending ? t("saving") : t("save")}
          </Button>
        </>
      )}
    </Card>
  );
}
