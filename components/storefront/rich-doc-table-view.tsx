// coding-standard: maintained
import type {
  RichDocTableCellNode,
  RichDocTableHeaderNode,
  RichDocTableNode,
} from "@/lib/storefront-rich-doc";
import { clampSpan, TABLE_HEADER_NODE } from "@/lib/storefront-rich-doc";
import { RichDocBlock } from "@/components/storefront/rich-doc-view";
import {
  proseTable,
  proseTableCell,
  proseTableHeader,
  proseTableWrap,
} from "@/components/storefront/storefront-prose-styles";

/**
 * Renders rich-doc tables (size charts, shipping tables). Cells hold block
 * content, so each recurses through the shared block dispatcher; spans are
 * clamped to sane integers (the stored JSON is untrusted).
 */
function Cell({ cell }: { cell: RichDocTableCellNode | RichDocTableHeaderNode }) {
  const isHeader = cell.type === TABLE_HEADER_NODE;
  const Tag = isHeader ? "th" : "td";
  const colSpan = clampSpan(cell.attrs?.colspan ?? 1);
  const rowSpan = clampSpan(cell.attrs?.rowspan ?? 1);
  return (
    <Tag
      style={isHeader ? proseTableHeader : proseTableCell}
      colSpan={colSpan > 1 ? colSpan : undefined}
      rowSpan={rowSpan > 1 ? rowSpan : undefined}
    >
      {(cell.content ?? []).map((block, i) => (
        <RichDocBlock key={i} block={block} />
      ))}
    </Tag>
  );
}

export function RichDocTableView({ table }: { table: RichDocTableNode }) {
  return (
    <div style={proseTableWrap}>
      <table style={proseTable}>
        <tbody>
          {(table.content ?? []).map((row, i) => (
            <tr key={i}>
              {(row.content ?? []).map((cell, j) => (
                <Cell key={j} cell={cell} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
