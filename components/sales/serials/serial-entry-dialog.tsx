"use client";
// coding-standard: maintained
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { BarcodeScanner } from "@/components/shared/barcode";
import type { SerialKind } from "@/components/sales/types";
import { useDebounce } from "@/hooks/use-debounce";
import { useSerialCheck } from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { cn } from "@ui/lib/utils";
import {
  MAX_SERIAL_LENGTH,
  duplicateSerials,
  fitSerialSlots,
  isLikelyImei,
  normalizeSerial,
} from "@/utils/serial";

export interface SerialEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  kind?: SerialKind | null;
  /** Units on the line — one input each. */
  quantity: number;
  value?: readonly string[];
  /** Called with one slot per unit (blank = not entered), as typed. */
  onSave: (slots: string[]) => void;
  /** Codes on the sale's other lines — a code may appear once per sale. */
  otherCodes?: readonly string[];
  /** This sale's own id, so the "already sold" check does not report itself. */
  excludeSaleId?: string;
  saving?: boolean;
  /** Replaces the default "one per unit" description. */
  description?: string;
}

/**
 * One input per unit for its serial / IMEI number (backend
 * `docs/plan/sale-serials.md`). A USB scanner types into the focused input and
 * presses Enter, which moves to the next one — the dialog holds focus, so a
 * scan here never reaches the product search behind it. The camera fills the
 * first empty input.
 *
 * Warnings, not blocks: an IMEI that fails its check digit, a code already
 * handed out on another sale. Blocks: a code twice on this sale, or longer than
 * the server accepts.
 */
export function SerialEntryDialog({
  open,
  onOpenChange,
  productName,
  kind,
  quantity,
  value,
  onSave,
  otherCodes = [],
  excludeSaleId,
  saving,
  description,
}: SerialEntryDialogProps) {
  const t = useTranslations("sales.serials");
  const [slots, setSlots] = useState<string[]>(() => fitSerialSlots(value, quantity));
  const [camera, setCamera] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!open) return;
    setSlots(fitSerialSlots(value, quantity));
    setCamera(false);
    // Only on opening: re-seeding on every `value` change would wipe typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const codes = useMemo(() => slots.map(normalizeSerial), [slots]);
  const twice = useMemo(() => duplicateSerials([...codes, ...otherCodes]), [codes, otherCodes]);
  const checkCodes = useDebounce(
    codes.filter((code) => code.length > 0 && code.length <= MAX_SERIAL_LENGTH),
    400,
  );
  const { data: soldElsewhere = [] } = useSerialCheck(open ? checkCodes : [], excludeSaleId);
  const matchFor = (code: string) => soldElsewhere.find((row) => row.code === code)?.matches[0];

  const filled = codes.filter(Boolean).length;
  const blocked = codes.some((code) => code && (twice.has(code) || code.length > MAX_SERIAL_LENGTH));

  const setSlot = (index: number, text: string) =>
    setSlots((prev) => prev.map((slot, i) => (i === index ? text : slot)));

  const focus = (index: number) => inputs.current[index]?.focus();

  const fillFromCamera = (code: string) => {
    setSlots((prev) => {
      const at = prev.findIndex((slot) => !slot.trim());
      if (at < 0 || prev.some((slot) => normalizeSerial(slot) === normalizeSerial(code))) return prev;
      return prev.map((slot, i) => (i === at ? code : slot));
    });
  };

  const save = () => {
    if (blocked) return;
    onSave(slots.map((slot) => slot.trim()));
  };

  const imei = kind === "imei";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t(imei ? "titleImei" : "title", { product: productName })}</DialogTitle>
          <DialogDescription>{description ?? t("description")}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
          {slots.map((slot, index) => {
            const code = codes[index];
            const match = code ? matchFor(code) : undefined;
            const error = !code
              ? undefined
              : twice.has(code)
                ? t("duplicate")
                : code.length > MAX_SERIAL_LENGTH
                  ? t("tooLong", { max: MAX_SERIAL_LENGTH })
                  : undefined;
            const warning = error
              ? undefined
              : match
                ? t(match.source === "replacement" ? "alreadyReplaced" : "alreadySold", {
                    invoice: match.invoiceNumber,
                  })
                : imei && code && !isLikelyImei(code)
                  ? t("notImei")
                  : undefined;
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-xs text-muted-foreground">
                    {t("unit", { n: index + 1 })}
                  </span>
                  <Input
                    ref={(el) => {
                      inputs.current[index] = el;
                    }}
                    autoFocus={index === slots.findIndex((s) => !s.trim())}
                    value={slot}
                    inputMode={imei ? "numeric" : "text"}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={t(imei ? "placeholderImei" : "placeholderSerial")}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => setSlot(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      if (index < slots.length - 1) focus(index + 1);
                      else save();
                    }}
                    className={cn("font-mono", error && "border-destructive")}
                  />
                </div>
                {(error || warning) && (
                  <p
                    className={cn(
                      "pl-16 text-xs",
                      error ? "text-destructive" : "text-amber-700 dark:text-amber-400",
                    )}
                  >
                    {error ?? warning}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {camera && <BarcodeScanner onDetect={fillFromCamera} active={camera} />}

        <DialogFooter className="items-center gap-2 sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCamera((on) => !on)}
              aria-pressed={camera}
            >
              {camera ? <CameraOff className="size-4" /> : <Camera className="size-4" />}
              {camera ? t("cameraStop") : t("camera")}
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("entered", { count: filled, total: quantity })}
            </span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={save} disabled={blocked || saving}>
              {t("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
