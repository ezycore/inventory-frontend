// coding-standard: maintained
import type { CSSProperties, ReactNode } from "react";
import { merchantLinkHref } from "@/lib/storefront-links";

const EXTERNAL = /^https?:\/\//i;

/**
 * A link the merchant typed into a section's `url` setting. A store path rides
 * the public base, a full URL opens in a new tab, and `tel:` / `mailto:` go
 * straight to the phone or mail app (`merchantLinkHref`).
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
  const target = merchantLinkHref(base, href);
  return (
    <a
      href={target}
      className={className}
      style={style}
      {...(EXTERNAL.test(target) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
