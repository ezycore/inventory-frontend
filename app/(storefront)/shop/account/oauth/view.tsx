"use client";
// coding-standard: maintained

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { storefrontApi } from "@/lib/storefront-client";
import { storeHref } from "@/lib/storefront-links";
import { useShopperStore } from "@/services/stores/use-shopper-store";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/**
 * Social sign-in landing. The API callback redirects here with the result in
 * the URL fragment (`#token=…` on success, `#error=…` otherwise) — fragments
 * stay out of request logs. We adopt the session, scrub the fragment from the
 * address bar, and bounce to the account page (or checkout's ?next= target).
 */
export default function OAuthLandingPage() {
  const { slug, base } = useStoreContext();
  const { t } = useStorefrontUI();
  const router = useRouter();
  const setAuth = useShopperStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = params.get("token");
    const next = params.get("next");
    const errorCode = params.get("error");
    // Scrub the fragment immediately — the token must not linger in the URL.
    window.history.replaceState(null, "", window.location.pathname);

    // setState must come from async callbacks, not the effect body
    // (react-hooks/set-state-in-effect) — resolve the session on a microtask.
    Promise.resolve().then(() => {
      if (!token) {
        setError(errorCode === "cancelled" ? t.oauthCancelled : t.oauthFailed);
        return;
      }
      return storefrontApi
        .me(slug, token)
        .then((shopper) => {
          setAuth(slug, token, shopper);
          toast.success(t.welcomeBack);
          const target =
            next && next.startsWith("/") && !next.startsWith("//")
              ? next
              : "/account";
          router.replace(storeHref(base, target));
        })
        .catch(() => setError(t.oauthFailed));
    });
  }, [slug, base, router, setAuth, t]);

  return (
    <div style={{ maxWidth: 440, margin: "0 auto", padding: "48px var(--pad) 64px", textAlign: "center" }}>
      {error ? (
        <>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}>{error}</h1>
          <Link
            href={storeHref(base, "/account")}
            style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)" }}
          >
            ← {t.signIn}
          </Link>
        </>
      ) : (
        <p style={{ fontSize: 14, color: "var(--muted)" }}>{t.oauthSigningIn}</p>
      )}
    </div>
  );
}
