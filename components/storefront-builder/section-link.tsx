// coding-standard: maintained
import type { CSSProperties, ReactNode } from "react";
import { storeLinkHref } from "@/lib/storefront-links";

/** `storeLinkHref` treats every non-http scheme as unsafe; these two are allowed in a section. */
const CONTACT_SCHEME = /^(tel:|mailto:)/i;
const EXTERNAL = /^https?:\/\//i;

/**
 * A link the merchant typed into a section's `url` setting. A store path rides
 * the public base, a full URL opens in a new tab, and `tel:` / `mailto:` go
 * straight to the phone or mail app.
 *
 * A plain `<a>`, not `next/link`: the destination is the merchant's free choice
 * and is often another site or an app, where prefetching buys nothing.
 */
export function SectionLink({
  base,
  href,
  className,
  style,
  children,
}: {
  base: string;
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const target = CONTACT_SCHEME.test(href) ? href : storeLinkHref(base, href);
  const external = EXTERNAL.test(target);
  return (
    <a
      href={target}
      className={className}
      style={style}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
