// coding-standard: maintained
import { Fragment, type CSSProperties, type ReactNode } from "react";
import type {
  RichDocBlockNode,
  RichDocInlineNode,
  RichDocRoot,
  RichDocTextNode,
} from "@/lib/storefront-rich-doc";
import {
  CALLOUT_NODE,
  FAQ_LIST_NODE,
  IMAGE_NODE,
  safeAlign,
  safeCssColor,
  SAFE_RICH_HREF,
  SAFE_RICH_IMAGE_SRC,
  safeImageAlign,
  safeImageWidth,
  safeImageWrap,
  TABLE_NODE,
} from "@/lib/storefront-rich-doc";
import { RichDocFaqView } from "@/components/storefront/rich-doc-faq-view";
import { RichDocTableView } from "@/components/storefront/rich-doc-table-view";
import { RichDocCalloutView } from "@/components/storefront/rich-doc-callout-view";
import {
  proseDivider,
  proseHeading,
  proseHighlight,
  proseImage,
  proseLink,
  proseList,
  proseParagraph,
  proseQuote,
} from "@/components/storefront/storefront-prose-styles";

/**
 * Renders rich-doc CMS page bodies (lib/storefront-rich-doc tree) as React
 * nodes — the rich-format twin of markdown-view.tsx, and the XSS boundary for
 * owner content: the stored JSON is untrusted (writable via the raw API, not
 * just the admin editor), so every attribute that becomes a style/href (link,
 * colour, alignment, table span) is re-validated here, and no raw HTML is ever
 * rendered.
 */

function renderTextNode(node: RichDocTextNode, key: number): ReactNode {
  let el: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") {
      el = <strong style={{ fontWeight: 700 }}>{el}</strong>;
    } else if (mark.type === "italic") {
      el = <em>{el}</em>;
    } else if (mark.type === "underline") {
      el = <u>{el}</u>;
    } else if (mark.type === "strike") {
      el = <s>{el}</s>;
    } else if (mark.type === "textStyle") {
      const color = safeCssColor(mark.attrs?.color);
      if (color) el = <span style={{ color }}>{el}</span>;
      // Invalid colour: mark dropped, text stays plain.
    } else if (mark.type === "highlight") {
      el = <mark style={proseHighlight(safeCssColor(mark.attrs?.color))}>{el}</mark>;
    } else if (mark.type === "link" && SAFE_RICH_HREF.test(mark.attrs?.href ?? "")) {
      const external = /^https?:\/\//i.test(mark.attrs.href);
      el = (
        <a
          href={mark.attrs.href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          style={proseLink}
        >
          {el}
        </a>
      );
    }
    // Unsafe link hrefs: the mark is dropped and the text stays plain.
  }
  return <Fragment key={key}>{el}</Fragment>;
}

export function RichDocInline({ nodes }: { nodes?: RichDocInlineNode[] }) {
  return (
    <>
      {(nodes ?? []).map((n, i) =>
        n.type === "hardBreak" ? <br key={i} /> : renderTextNode(n, i),
      )}
    </>
  );
}

const clampLevel = (level: number): 1 | 2 | 3 =>
  (Math.min(3, Math.max(1, Math.round(level) || 1)) as 1 | 2 | 3);

// Only set textAlign when it's a validated value, so untagged blocks inherit.
const withAlign = (base: CSSProperties, align: unknown): CSSProperties => {
  const a = safeAlign(align);
  return a ? { ...base, textAlign: a } : base;
};

export function RichDocBlock({ block }: { block: RichDocBlockNode }) {
  switch (block.type) {
    case "heading":
      return (
        <div style={withAlign(proseHeading(clampLevel(block.attrs?.level ?? 1)), block.attrs?.textAlign)}>
          <RichDocInline nodes={block.content} />
        </div>
      );
    case "paragraph":
      return (
        <p style={withAlign(proseParagraph, block.attrs?.textAlign)}>
          <RichDocInline nodes={block.content} />
        </p>
      );
    case "bulletList":
    case "orderedList": {
      const Tag = block.type === "orderedList" ? "ol" : "ul";
      return (
        <Tag style={proseList}>
          {(block.content ?? []).map((item, i) => (
            <li key={i}>
              {(item.content ?? []).map((child, j) => (
                <Fragment key={j}>
                  {j > 0 ? <br /> : null}
                  <RichDocInline nodes={child.content} />
                </Fragment>
              ))}
            </li>
          ))}
        </Tag>
      );
    }
    case "blockquote":
      return (
        <blockquote style={proseQuote}>
          {(block.content ?? []).map((child, i) => (
            <Fragment key={i}>
              {i > 0 ? <br /> : null}
              <RichDocInline nodes={child.content} />
            </Fragment>
          ))}
        </blockquote>
      );
    case "horizontalRule":
      return <hr style={proseDivider} />;
    case IMAGE_NODE: {
      // Re-validated here, not trusted from the document. This tree is writable
      // through the raw API, so the editor's `allowBase64: false` is a
      // convenience for the merchant and this is the actual boundary — an
      // unsafe or absent `src` renders nothing rather than a broken image.
      const src = block.attrs?.src;
      if (typeof src !== "string" || !SAFE_RICH_IMAGE_SRC.test(src)) return null;
      // Width and alignment are re-validated against the same closed lists the
      // editor offers. A raw-API write could otherwise set `width: 4000` or an
      // `align` that lands in a style string.
      //
      // Geometry other than the width lives in CSS (`.sf-rdimg`, keyed off these
      // data attributes) rather than in this style object, because text-wrap has
      // to switch OFF below 680px — a 50% float on a 360px phone leaves two
      // unreadable strips — and an inline style cannot carry a media query.
      const align = safeImageAlign(block.attrs?.align);
      return (
        <img
          className="sf-rdimg"
          data-align={align}
          data-wrap={safeImageWrap(block.attrs?.wrap) ? "1" : undefined}
          src={src}
          // `?? ""` keeps the attribute present when the merchant wrote no
          // description: an undescribed image is decorative, and `alt=""` is how
          // that is said. Dropping the attribute makes a screen reader read the
          // filename out instead.
          alt={block.attrs?.alt ?? ""}
          title={block.attrs?.title ?? undefined}
          loading="lazy"
          style={proseImage(safeImageWidth(block.attrs?.width), align)}
        />
      );
    }
    case FAQ_LIST_NODE:
      return <RichDocFaqView items={block.content ?? []} />;
    case TABLE_NODE:
      return <RichDocTableView table={block} />;
    case CALLOUT_NODE:
      return <RichDocCalloutView callout={block} />;
    default:
      return null;
  }
}

export function RichDocView({ doc }: { doc: RichDocRoot }) {
  return (
    // `sf-rich-doc` carries the clearfix: a wrapped (floated) image would
    // otherwise escape this container and collide with whatever renders next.
    <div className="sf-rich-doc">
      {(doc.content ?? []).map((block, i) => (
        <RichDocBlock key={i} block={block} />
      ))}
    </div>
  );
}
