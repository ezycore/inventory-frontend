// coding-standard: maintained
import type { RichDocFaqItemNode } from "@/lib/storefront-rich-doc";
import { RichDocInline } from "@/components/storefront/rich-doc-view";
import {
  proseFaqAnswerLine,
  proseFaqBadge,
  proseFaqCard,
  proseFaqGroup,
  proseFaqQuestionRow,
} from "@/components/storefront/storefront-prose-styles";

/**
 * Styled Q&A cards for rich-doc FAQ blocks — visually identical to the
 * legacy markdown renderer's "faq" block (markdown-view.tsx).
 */
export function RichDocFaqView({ items }: { items: RichDocFaqItemNode[] }) {
  return (
    <div style={proseFaqGroup}>
      {items.map((item, i) => {
        const [question, answer] = item.content ?? [];
        return (
          <div key={i} style={proseFaqCard}>
            <div style={proseFaqQuestionRow}>
              <span style={proseFaqBadge}>Q.</span>
              <span>
                <RichDocInline nodes={question?.content} />
              </span>
            </div>
            {(answer?.content ?? []).map((line, j) => (
              <div key={j} style={proseFaqAnswerLine(j === 0)}>
                <RichDocInline nodes={line.content} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
