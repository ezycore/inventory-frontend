// coding-standard: maintained
import { Fragment, type ReactNode } from "react";
import type {
  RichDocBlockNode,
  RichDocInlineNode,
  RichDocRoot,
  RichDocTextNode,
} from "@/lib/storefront-rich-doc";
import { FAQ_LIST_NODE, SAFE_RICH_HREF } from "@/lib/storefront-rich-doc";
import { RichDocFaqView } from "@/components/storefront/rich-doc-faq-view";
import {
  proseDivider,
  proseHeading,
  proseLink,
  proseList,
  proseParagraph,
  proseQuote,
} from "@/components/storefront/storefront-prose-styles";

/**
 * Renders rich-doc CMS page bodies (lib/storefront-rich-doc tree) as React
 * nodes — the rich-format twin of markdown-view.tsx, and the XSS boundary for
 * owner content: the stored JSON is untrusted (writable via the raw API, not
 * just the admin editor), so link hrefs are re-validated here regardless of
 * what the editor allowed, and no raw HTML is ever rendered.
 */

function renderTextNode(node: RichDocTextNode, key: number): ReactNode {
  let el: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") {
      el = <strong style={{ fontWeight: 700 }}>{el}</strong>;
    } else if (mark.type === "italic") {
      el = <em>{el}</em>;
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

export function RichDocBlock({ block }: { block: RichDocBlockNode }) {
  switch (block.type) {
    case "heading":
      return (
        <div style={proseHeading(clampLevel(block.attrs?.level ?? 1))}>
          <RichDocInline nodes={block.content} />
        </div>
      );
    case "paragraph":
      return (
        <p style={proseParagraph}>
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
    case FAQ_LIST_NODE:
      return <RichDocFaqView items={block.content ?? []} />;
    default:
      return null;
  }
}

export function RichDocView({ doc }: { doc: RichDocRoot }) {
  return (
    <div>
      {(doc.content ?? []).map((block, i) => (
        <RichDocBlock key={i} block={block} />
      ))}
    </div>
  );
}
