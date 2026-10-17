"use client";
// coding-standard: maintained

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { contactUrl } from "@/constants/brand";
import { useSignupOptions } from "@/services/api";
import { signupUrl } from "@/lib/organization-utils";

/**
 * The "no account yet?" line under both login forms.
 *
 * While self-signup is closed (backend `SIGNUP_ACCESS_KEY`) it says "Talk to
 * us" and goes to the marketing contact page instead of a signup form that
 * would only tell them to talk to us. It asks the keyless question, which the
 * backend does not rate-limit. Until the answer arrives it shows the signup
 * link, the long-standing default, rather than flashing nothing.
 */
export function SignupPrompt() {
  const t = useTranslations("auth.login");
  const locale = useLocale();
  const { data } = useSignupOptions(undefined);

  if (data && !data.selfSignup) {
    return (
      <>
        {t("newHere")}{" "}
        <a href={contactUrl(locale)} className="underline underline-offset-4">
          {t("talkToUs")}
        </a>
      </>
    );
  }
  return (
    <>
      {t("noAccount")}{" "}
      <Link href={signupUrl()} className="underline underline-offset-4">
        {t("signUp")}
      </Link>
    </>
  );
}
