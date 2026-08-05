import type { ReactNode } from "react";
import {
  Inter,
  Noto_Sans_Bengali,
  Fraunces,
  Space_Grotesk,
} from "next/font/google";
import { StorefrontUIProvider } from "@/services/storefront/ui-context";
import "./storefront.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const notoBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-bengali",
  display: "swap",
});

// The two alternative Latin faces a design template can stamp in. They are
// loaded for every storefront but only render when a template selects them —
// next/font self-hosts and preloads, so the cost is the CSS, not a blocking
// request per shop. Bengali is served by notoBengali in all three stacks.
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

const serif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

// Set the stored theme before paint so dark-mode users don't flash light.
const NO_FLASH = `(function(){try{var t=localStorage.getItem('ezy-sf-theme');var r=document.querySelector('.sf-root');if(r){if(t==='dark')r.setAttribute('data-theme','dark');var l=localStorage.getItem('ezy-sf-lang');if(l==='bn')r.setAttribute('lang','bn');}}catch(e){}})();`;

/**
 * Storefront route-group shell. Scopes the storefront design system (`.sf-root`
 * tokens + Inter/Bengali fonts in storefront.css) so it's fully decoupled from
 * the admin app, and provides theme (light/dark) + language (EN/BN) via
 * `StorefrontUIProvider`. Server Component so pages render SEO-friendly HTML.
 */
export default function StorefrontGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div
        className={`sf-root min-h-screen ${inter.variable} ${notoBengali.variable} ${grotesk.variable} ${serif.variable}`}
        data-theme="light"
      >
        <StorefrontUIProvider>{children}</StorefrontUIProvider>
      </div>
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
    </>
  );
}
