"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useVerifyEmail } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { storeHref } from "@/lib/storefront-links";

export default function VerifyEmailPage() {
  const { slug, base } = useStoreContext();
  const token = useSearchParams().get("token") ?? "";
  const verify = useVerifyEmail(slug);
  const { mutate } = verify;
  const fired = useRef(false);

  // Auto-verify once when the page opens from the email link.
  useEffect(() => {
    if (fired.current || !token) return;
    fired.current = true;
    mutate(token);
  }, [token, mutate]);

  let body: React.ReactNode;
  if (!token) {
    body = <p className="text-sm text-gray-600">Missing verification token.</p>;
  } else if (verify.isPending) {
    body = <p className="text-sm text-gray-600">Verifying…</p>;
  } else if (verify.isSuccess) {
    body = <p className="text-sm text-green-700">Your email is verified. Thanks!</p>;
  } else if (verify.isError) {
    body = (
      <p className="text-sm text-red-600">
        {(verify.error as Error)?.message || "This link is invalid or expired."}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 py-8 text-center">
      <h1 className="text-xl font-semibold">Email verification</h1>
      {body}
      <Link
        href={storeHref(base, "/account")}
        className="inline-block rounded-md border px-4 py-2 text-sm"
      >
        Go to my account
      </Link>
    </div>
  );
}
