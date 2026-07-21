// coding-standard: maintained
"use client";

import Link from "next/link";
import { Fragment } from "react";
import {
  parseStorefrontMarkdown,
  type SfBlock,
  type SfInline,
} from "@/lib/storefront-markdown";
import { cn } from "@ui/lib/utils";

/**
 * Renders a help page body with the admin app's typography.
 *
 * Deliberately separate from `components/storefront/markdown-view.tsx`: that one styles the
 * *storefront* (inline styles against storefront CSS variables, so an owner's themed shop stays
 * consistent), this one styles the *admin* (Tailwind + shadcn tokens). Only the parser is shared —
 * a themeable single renderer would mean threading a class map through every block for two callers
 * whose styling primitives have nothing in common.
 *
 * Internal `/help/...` links are rendered by the caller's `linkComponent` so the help drawer can
 * navigate in place instead of throwing the user out of the screen they were working on.
 */

const HEADING_CLASS: Record<1 | 2 | 3, string> = {
  1: "mt-7 mb-2 text-xl font-semibold tracking-tight",
  2: "mt-7 mb-2 text-base font-semibold tracking-tight",
  3: "mt-5 mb-1.5 text-sm font-semibold tracking-tight",
};

interface HelpMarkdownProps {
  source: string;
  /** Called instead of navigating when an in-app `/help/<slug>` link is followed. */
  onNavigate?: (slug: string) => void;
}

function InlineNodes({ nodes, onNavigate }: { nodes: SfInline[]; onNavigate?: (slug: string) => void }) {
  return (
    <>
      {nodes.map((node, i) => {
        if (node.kind === "bold") return <strong key={i} className="font-semibold text-foreground">{node.text}</strong>;
        if (node.kind === "italic") return <em key={i}>{node.text}</em>;
        if (node.kind === "code") {
          return (
            <code key={i} className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
              {node.text}
            </code>
          );
        }
        if (node.kind === "link") {
          const internal = node.href.match(/^\/help\/([\w-]+)$/);
          if (internal && onNavigate) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onNavigate(internal[1])}
                className="text-primary underline underline-offset-4 hover:no-underline"
              >
                {node.text}
              </button>
            );
          }
          const external = /^https?:\/\//i.test(node.href);
          return (
            <Link
              key={i}
              href={node.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="text-primary underline underline-offset-4 hover:no-underline"
            >
              {node.text}
            </Link>
          );
        }
        return <Fragment key={i}>{node.text}</Fragment>;
      })}
    </>
  );
}

function BlockNode({ block, onNavigate }: { block: SfBlock; onNavigate?: (slug: string) => void }) {
  const inline = (nodes: SfInline[]) => <InlineNodes nodes={nodes} onNavigate={onNavigate} />;

  switch (block.kind) {
    case "heading":
      return <h2 className={cn(HEADING_CLASS[block.level], "first:mt-0")}>{inline(block.inline)}</h2>;

    case "paragraph":
      return (
        <p className="my-2.5 text-sm leading-relaxed text-muted-foreground">
          {block.lines.map((line, i) => (
            <Fragment key={i}>
              {i > 0 ? <br /> : null}
              {inline(line)}
            </Fragment>
          ))}
        </p>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={cn(
            "my-2.5 flex flex-col gap-1.5 pl-6 text-sm leading-relaxed text-muted-foreground",
            block.ordered ? "list-decimal" : "list-disc",
          )}
        >
          {block.items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </Tag>
      );
    }

    case "quote":
      return (
        <blockquote className="my-3.5 border-l-[3px] border-primary py-1 pl-4 text-sm leading-relaxed text-muted-foreground">
          {inline(block.inline)}
        </blockquote>
      );

    case "divider":
      return <hr className="my-6 border-border" />;

    case "table":
      // Scrolls in its own box so a wide table never widens the drawer on a phone.
      return (
        <div className="my-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {block.headers.map((cell, i) => (
                  <th key={i} className="whitespace-nowrap border-b-2 px-3 py-2 text-left font-semibold">
                    {inline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border-b px-3 py-2 align-top text-muted-foreground">
                      {inline(cell)}
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
        <div className="my-4 flex flex-col gap-3">
          {block.items.map((item, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <div className="text-sm font-semibold">{inline(item.q)}</div>
              {item.a.map((line, j) => (
                <div key={j} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {inline(line)}
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

export function HelpMarkdown({ source, onNavigate }: HelpMarkdownProps) {
  return (
    <div>
      {parseStorefrontMarkdown(source).map((block, i) => (
        <BlockNode key={i} block={block} onNavigate={onNavigate} />
      ))}
    </div>
  );
}
