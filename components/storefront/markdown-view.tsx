// coding-standard: maintained
import { Fragment, type CSSProperties } from "react";
import {
  parseStorefrontMarkdown,
  type SfBlock,
  type SfInline,
} from "@/lib/storefront-markdown";

/**
 * Renders CMS page bodies (lib/storefront-markdown block model) with the
 * storefront's typography and tokens — dark-mode safe, no raw HTML.
 */

const HEADING_SIZE: Record<1 | 2 | 3, number> = { 1: 22, 2: 19, 3: 16.5 };

function Inline({ nodes }: { nodes: SfInline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        if (n.kind === "bold") return <strong key={i} style={{ fontWeight: 700 }}>{n.text}</strong>;
        if (n.kind === "italic") return <em key={i}>{n.text}</em>;
        if (n.kind === "code") {
          return (
            <code
              key={i}
              style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 5, padding: "1px 5px", fontSize: "0.9em" }}
            >
              {n.text}
            </code>
          );
        }
        if (n.kind === "link") {
          const external = /^https?:\/\//i.test(n.href);
          return (
            <a
              key={i}
              href={n.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              style={{ color: "var(--primary)", textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              {n.text}
            </a>
          );
        }
        return <Fragment key={i}>{n.text}</Fragment>;
      })}
    </>
  );
}

const bodyText: CSSProperties = { fontSize: 15, lineHeight: 1.75, color: "var(--text)" };

function Block({ block }: { block: SfBlock }) {
  switch (block.kind) {
    case "heading":
      return (
        <div style={{ fontSize: HEADING_SIZE[block.level], fontWeight: 700, letterSpacing: "-0.015em", margin: "22px 0 2px" }}>
          <Inline nodes={block.inline} />
        </div>
      );
    case "paragraph":
      return (
        <p style={{ ...bodyText, margin: "10px 0" }}>
          {block.lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 ? <br /> : null}
              <Inline nodes={line} />
            </Fragment>
          ))}
        </p>
      );
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag style={{ ...bodyText, margin: "10px 0", paddingLeft: 24, display: "flex", flexDirection: "column", gap: 5 }}>
          {block.items.map((item, i) => (
            <li key={i}>
              <Inline nodes={item} />
            </li>
          ))}
        </Tag>
      );
    }
    case "quote":
      return (
        <blockquote style={{ ...bodyText, color: "var(--muted)", margin: "14px 0", padding: "4px 0 4px 16px", borderLeft: "3px solid var(--primary)" }}>
          <Inline nodes={block.inline} />
        </blockquote>
      );
    case "divider":
      return <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "24px 0" }} />;
    case "table":
      // Scrolls in its own box so a wide table never widens the page on a phone.
      return (
        <div style={{ overflowX: "auto", margin: "16px 0" }}>
          <table style={{ ...bodyText, borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {block.headers.map((cell, i) => (
                  <th key={i} style={{ textAlign: "left", fontWeight: 700, padding: "8px 12px", borderBottom: "2px solid var(--border)", whiteSpace: "nowrap" }}>
                    <Inline nodes={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", verticalAlign: "top" }}>
                      <Inline nodes={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "faq":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "16px 0" }}>
          {block.items.map((item, i) => (
            <div key={i} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, padding: "15px 18px" }}>
              <div style={{ display: "flex", gap: 10, fontSize: 15, fontWeight: 700, lineHeight: 1.5 }}>
                {/* Muted, not brand: a dark brand colour would vanish on dark cards. */}
                <span style={{ color: "var(--muted)", flex: "none" }}>Q.</span>
                <span><Inline nodes={item.q} /></span>
              </div>
              {item.a.map((line, j) => (
                <div key={j} style={{ marginTop: j === 0 ? 7 : 4, paddingLeft: 26, fontSize: 14, lineHeight: 1.7, color: "var(--muted)" }}>
                  <Inline nodes={line} />
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function MarkdownView({ source }: { source: string }) {
  const blocks = parseStorefrontMarkdown(source);
  return (
    <div>
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}
