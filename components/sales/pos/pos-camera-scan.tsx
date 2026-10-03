"use client";
// coding-standard: maintained
import { useState } from "react";
import { Camera } from "lucide-react";
import { useTranslations } from "next-intl";
import { BarcodeScanner } from "@/components/shared/barcode";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";

/**
 * Scan with the phone's or laptop's camera — for a counter without a USB
 * scanner. Each read goes through the same `handleBarcodeScan` as a scanner,
 * and the dialog stays open so a basket can be scanned in one go.
 */
export function PosCameraScan({
  onDetect,
  cartCount,
}: {
  onDetect: (code: string) => void;
  cartCount: number;
}) {
  const t = useTranslations("sales.pos");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="size-12 shrink-0" aria-label={t("cameraScan")}>
          <Camera className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("cameraTitle")}</DialogTitle>
          <DialogDescription>{t("cameraHelp")}</DialogDescription>
        </DialogHeader>
        {open && <BarcodeScanner onDetect={onDetect} active={open} />}
        <DialogFooter className="items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">{t("cartCount", { count: cartCount })}</span>
          <Button onClick={() => setOpen(false)}>{t("cameraDone")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
