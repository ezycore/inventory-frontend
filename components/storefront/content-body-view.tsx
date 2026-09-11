// coding-standard: maintained
import { parseRichDoc } from "@/lib/storefront-rich-doc";
import { MarkdownView } from "@/components/storefront/markdown-view";
import { RichDocView } from "@/components/storefront/rich-doc-view";

/**
 * Renders a rich-text body in whichever format it is stored: rich-doc JSON
 * (saved through the rich-text editor) or a legacy value (not yet re-saved —
 * they convert lazily on next edit). Use this everywhere a body is displayed
 * read-only so both formats stay supported.
 *
 * `legacyFormat` picks how to read a NON-rich value, and must match the editor's
 * (`FormField.legacyFormat`). A CMS page body really was markdown; a product
 * description was a POS textarea, where `#` and `-` are literal characters the
 * merchant typed and `MarkdownView` would eat them.
 */
export function ContentBodyView({
  body,
  legacyFormat = "markdown",
}: {
  body: string;
  legacyFormat?: "markdown" | "plaintext";
}) {
  const doc = parseRichDoc(body);
  if (doc) return <RichDocView doc={doc} />;
  if (legacyFormat === "plaintext") {
    return <p style={{ whiteSpace: "pre-line", margin: 0 }}>{body}</p>;
  }
  return <MarkdownView source={body} />;
}
