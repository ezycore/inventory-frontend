"use client";
// coding-standard: maintained

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Store } from "lucide-react";

import { contactUrl } from "@/constants/brand";
import { Button } from "@/ui/components/button";

/**
 * What a visitor sees on `/signup` while self-signup is closed (backend
 * `SIGNUP_ACCESS_KEY` set, no valid `?key=`). An ERP has a learning curve, so
 * workspaces are set up with the merchant by the team (owner decision
 * 2026-10-17, temporary); this sends them to the contact page, which carries
 * the WhatsApp button and the callback form.
 */
export function SignupClosed() {
  const t = useTranslations("auth.signup.closed");
  const locale = useLocale();

  return (
    <div className="flex flex-col items-start gap-5 rounded-xl border bg-card p-6 sm:p-8">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Store className="size-6 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("body")}</p>
      </div>
      <Button asChild className="gap-2">
        <a href={contactUrl(locale)}>
          {t("cta")}
          <ArrowRight className="size-4" />
        </a>
      </Button>
      <p className="text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
