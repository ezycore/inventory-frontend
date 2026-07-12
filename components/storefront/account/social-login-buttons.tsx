"use client";
// coding-standard: maintained

import type { CSSProperties } from "react";
import { oauthStartUrl } from "@/lib/storefront-client";
import { useStore } from "@/services/storefront/hooks";
import { useStoreContext } from "@/services/storefront/store-context";
import { useStorefrontUI } from "@/services/storefront/ui-context";

/**
 * "or continue with" block under the login/register form. Renders nothing
 * unless the backend reports providers with credentials configured. Buttons
 * navigate the whole page — the API owns the OAuth round-trip and lands the
 * shopper back on /account/oauth with the session token.
 */
export function SocialLoginButtons() {
  const { slug } = useStoreContext();
  const { t } = useStorefrontUI();
  const { data: store } = useStore(slug);
  const providers = store?.oauthProviders ?? [];
  if (providers.length === 0) return null;

  const go = (provider: "google" | "facebook") => {
    // Carry checkout's ?next= through the provider round-trip.
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.href = oauthStartUrl(
      slug,
      provider,
      next && next.startsWith("/") && !next.startsWith("//") ? next : undefined,
    );
  };

  const btn: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0 14px" }}>
        <span style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {t.orContinueWith}
        </span>
        <span style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {providers.includes("google") ? (
          <button type="button" style={btn} onClick={() => go("google")}>
            <GoogleMark />
            {t.continueWithGoogle}
          </button>
        ) : null}
        {providers.includes("facebook") ? (
          <button type="button" style={btn} onClick={() => go("facebook")}>
            <FacebookMark />
            {t.continueWithFacebook}
          </button>
        ) : null}
      </div>
    </>
  );
}

/** Official multi-colour Google "G". */
function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.4 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.8c4.4-4.1 7.2-10.1 7.2-17.5z" />
      <path fill="#FBBC05" d="M10.4 28.7a14.5 14.5 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.3-5.6l-7.4-5.8c-2.1 1.4-4.8 2.2-7.9 2.2-6.3 0-11.7-3.9-13.6-9.4l-7.8 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

/** Facebook roundel. */
function FacebookMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden focusable="false">
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M16.4 15.5l.5-3.3h-3.2V10c0-.9.4-1.8 1.9-1.8h1.4V5.4s-1.3-.2-2.5-.2c-2.6 0-4.3 1.6-4.3 4.4v2.6H7.3v3.3h2.9V23a11.6 11.6 0 0 0 3.5 0v-7.5h2.7z"
      />
    </svg>
  );
}
