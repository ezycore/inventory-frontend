// coding-standard: maintained
import type { JsonLdNode } from "@/lib/storefront-jsonld";

/**
 * Renders schema.org nodes as `<script type="application/ld+json">`.
 *
 * Server component on purpose: the whole point is that the markup is in the SSR
 * HTML, so a crawler reads it without executing anything.
 *
 * `<` is escaped to `<` — a product name or description containing
 * `</script>` would otherwise close the tag early and turn merchant-authored text
 * into executable markup. `JSON.stringify` does not do this for you.
 */
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  const nodes = Array.isArray(data) ? data : [data];
  return (
    <>
      {nodes.map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(node).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
