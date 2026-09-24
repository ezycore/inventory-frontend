"use client";
// coding-standard: maintained
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useSaveSmsTemplate,
  useSmsTemplatePreview,
  type SmsTemplateBody,
} from "@/services/api";
import type { NotificationEventRow } from "@/types/api";
import { SmsFitCases } from "@/components/notifications/sms-fit-cases";
import { SmsTemplateFeedback } from "@/components/notifications/sms-template-feedback";
import { SmsVarChips } from "@/components/notifications/sms-var-chips";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/ui/components/sheet";
import { Textarea } from "@/ui/components/textarea";

type Fallbacks = NonNullable<SmsTemplateBody["fallbacks"]>;

const AUDIENCE = "customer" as const;

/**
 * The customer-SMS editor for one event (backend
 * `docs/plan/sms-template-editor.md` §5).
 *
 * Everything that decides whether a draft is acceptable happens on the server:
 * the draft is debounced to the preview endpoint, and Save stays off until the
 * answer for THIS text says it is valid. The sheet only edits text, inserts
 * variables and renders the verdict.
 *
 * Mounted by the matrix only while open, keyed by event, so it always starts
 * from the stored wording — there is no reset-on-open effect to get wrong.
 */
export function SmsTemplateSheet({
  row,
  eventLabel,
  onClose,
}: {
  row: NotificationEventRow;
  eventLabel: string;
  onClose: () => void;
}) {
  const t = useTranslations("settings.notifications.smsEditor");
  const override = row.templates?.smsByAudience?.customer;
  const [body, setBody] = useState(
    override?.body ?? row.smsPreview.customer?.template ?? "",
  );
  const [fallbacks, setFallbacks] = useState<Fallbacks>(
    override?.fallbacks ?? {},
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const save = useSaveSmsTemplate();

  const draft = useMemo<SmsTemplateBody>(
    () => ({ eventKey: row.key, audience: AUDIENCE, body, fallbacks }),
    [row.key, body, fallbacks],
  );
  const debounced = useDebounce(draft, 300);
  const preview = useSmsTemplatePreview(debounced);
  // The answer on screen may be for an older draft while the next one is in
  // flight; only an answer for exactly this draft may enable Save.
  const current = debounced === draft && !preview.isPlaceholderData;
  const result = preview.data;

  const insert = (token: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + token + body.slice(end));
    // Put the caret after the token, where the merchant expects to keep typing.
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  // Phone keyboards type ’ and —; the server stores them as ' and -. Swap the
  // server's form in once the merchant leaves the field (never mid-typing, where
  // replacing the text would move their cursor) so they see what will be sent.
  const adoptNormalized = () => {
    if (current && result && result.normalizedBody !== body) {
      setBody(result.normalizedBody);
    }
  };

  const submit = (nextBody: string) =>
    save.mutate(
      { eventKey: row.key, audience: AUDIENCE, body: nextBody, fallbacks },
      { onSuccess: onClose },
    );

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-lg"
      >
        <SheetHeader className="border-b pr-12">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>
            <span className="font-medium text-foreground">{eventLabel}</span>
            {" · "}
            {t("description")}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="sms-template-body">{t("bodyLabel")}</Label>
            <Textarea
              id="sms-template-body"
              ref={textareaRef}
              value={body}
              rows={4}
              className="min-h-28 font-mono text-sm leading-relaxed"
              aria-invalid={current && result ? !result.valid : undefined}
              onChange={(event) => setBody(event.target.value)}
              onBlur={adoptNormalized}
            />
            <p className="text-xs text-muted-foreground">{t("bodyHint")}</p>
          </div>

          <SmsTemplateFeedback
            preview={result}
            checking={preview.isFetching || !current}
          />

          <SmsVarChips vars={row.vars} onInsert={insert} />

          {result?.fallbackVars.map((name) => (
            <div key={name} className="space-y-1.5">
              <Label htmlFor={`sms-fallback-${name}`}>
                {t("fallbackLabel", { variable: t(`vars.${name}` as never) })}
              </Label>
              <Input
                id={`sms-fallback-${name}`}
                value={fallbacks[name] ?? ""}
                onChange={(event) =>
                  setFallbacks({ ...fallbacks, [name]: event.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">{t("fallbackHint")}</p>
            </div>
          ))}

          <SmsFitCases cases={result?.cases ?? []} />
        </div>

        <SheetFooter className="sticky bottom-0 border-t bg-popover sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={save.isPending || !override}
            onClick={() => submit("")}
          >
            {t("reset")}
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 sm:flex-none"
              onClick={onClose}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              className="flex-1 sm:flex-none"
              disabled={!current || !result?.valid || save.isPending}
              onClick={() => submit(body)}
            >
              {save.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
