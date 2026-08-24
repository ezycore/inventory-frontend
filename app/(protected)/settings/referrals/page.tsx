"use client";
// coding-standard: maintained
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useGetReferralLink } from "@/services/api";
import { Button } from "@/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/ui/components/card";
import PageHeader from "@/ui/components/header";
import { Input } from "@/ui/components/input";
import { copyText } from "@/utils/clipboard";
import { Check, Copy, Loader2, TicketPercent } from "lucide-react";

/**
 * The WhatsApp glyph, inlined rather than imported from the storefront's icon
 * set (`components/storefront/sf-icons.tsx`) — that set is deliberately kept
 * independent of the admin's lucide usage (see its own header comment). This
 * is the same standard mark, just not shared code across that boundary.
 */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.05L2 22l5.1-1.33A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.03.79.81-2.95-.2-.31A8.2 8.2 0 1 1 12 20.2Zm4.5-6.14c-.25-.12-1.46-.72-1.68-.8-.23-.09-.39-.12-.56.12-.16.25-.64.8-.79.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.3-2.89c-.25-.43.25-.4.71-1.32.08-.16.04-.3-.02-.42-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.48c-.16 0-.42.06-.64.3-.22.25-.84.83-.84 2.02s.86 2.34.98 2.5c.12.16 1.7 2.6 4.12 3.64 1.53.66 2.13.72 2.9.6.47-.07 1.46-.6 1.66-1.17.2-.58.2-1.07.14-1.17-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

export default function ReferralsSettingsPage() {
  const t = useTranslations("settings.referrals");
  const [copied, setCopied] = useState(false);

  const { data: referral, isLoading } = useGetReferralLink();

  const handleCopy = async () => {
    if (!referral) return;
    try {
      await copyText(referral.url);
      setCopied(true);
      toast.success(t("toasts.copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("toasts.copyFailed"));
    }
  };

  const whatsappShareUrl = referral
    ? `https://wa.me/?text=${encodeURIComponent(referral.url)}`
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subTitle={t("subtitle")} />

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : referral ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("linkTitle")}</CardTitle>
            <CardDescription>{t("linkDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input value={referral.url} readOnly className="font-mono text-sm" />
              <Button type="button" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {t("copy")}
              </Button>
            </div>
            {whatsappShareUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="h-4 w-4" />
                  {t("shareWhatsapp")}
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          <TicketPercent className="h-8 w-8" />
          <p className="text-sm">{t("empty")}</p>
        </div>
      )}
    </div>
  );
}
