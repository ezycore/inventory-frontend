"use client";
// coding-standard: maintained

import { Copy, ExternalLink, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/components/dialog";
import { copyText } from "@/utils/clipboard";

/**
 * The moment the shop goes live.
 *
 * Publishing used to succeed in silence — the switch stayed on, no toast, no
 * confirmation — so the merchant could not tell it had worked without visiting
 * the URL themselves (QA-033). For an F-commerce seller this is *the* moment:
 * the first time they own a shop link.
 *
 * The share buttons are deliberate distribution, not decoration. A merchant
 * announcing their own shop on Facebook or WhatsApp is how this product reaches
 * the next merchant, and the launch post is the one they are most motivated to
 * write. Both open the platforms' plain share endpoints — no SDK, no tracking
 * pixel, nothing to consent to.
 *
 * Shown only on the false → true transition, never on an ordinary save of an
 * already-live store.
 */
export function StorePublishedDialog({
  open,
  onOpenChange,
  url,
  storeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  storeName?: string;
}) {
  const shareText = storeName
    ? `${storeName} is now online! Order here:`
    : "My shop is now online! Order here:";

  const copy = async () => {
    try {
      await copyText(url);
      toast.success("Store URL copied");
    } catch {
      toast.error("Couldn't copy the URL");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <PartyPopper className="size-6 text-primary" />
          </div>
          {/* English, like the rest of this dialog and the whole ecommerce
              admin surface (1 of 97 components uses `useTranslations`). This
              title shipped as hardcoded Bangla — `আপনার দোকান এখন লাইভ 🎉` —
              above an English body and English buttons, so BOTH locales got a
              half-translated dialog and neither got a coherent one. Translate
              this surface as a whole, or not at all; do not do one string. */}
          <DialogTitle className="text-center text-xl">
            Your store is live 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            Share the link and start taking orders.
          </DialogDescription>
        </DialogHeader>

        {/* The URL is the point of the dialog, so it gets the visual weight. */}
        <div className="rounded-lg border bg-muted/50 px-3 py-3 text-center">
          <code className="break-all text-sm font-semibold">{url}</code>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={copy}>
            <Copy className="size-4" /> Copy link
          </Button>
          <Button variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> Visit
            </a>
          </Button>
        </div>

        <DialogFooter className="sm:flex-col sm:space-x-0">
          <p className="mb-2 text-center text-xs text-muted-foreground">
            Tell your customers
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button asChild className="bg-[#1877F2] text-white hover:bg-[#1877F2]/90">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on Facebook
              </a>
            </Button>
            <Button asChild className="bg-[#25D366] text-white hover:bg-[#25D366]/90">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on WhatsApp
              </a>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
