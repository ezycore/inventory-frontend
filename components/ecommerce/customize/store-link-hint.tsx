// coding-standard: maintained

import { storeLinkHref } from "@/lib/storefront-links";

/** Shows how an owner-entered route resolves on the tenant storefront. */
export function StoreLinkHint({ value }: { value?: string }) {
  const raw = value?.trim();
  if (!raw) return null;
  const unsafe = /^[a-z][a-z\d+.-]*:/i.test(raw) && !/^https?:\/\//i.test(raw);
  return (
    <p className={unsafe ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
      {unsafe
        ? "Unsupported link. Use a store path or an https:// URL."
        : `Destination: ${storeLinkHref("/shop", raw)}`}
    </p>
  );
}
