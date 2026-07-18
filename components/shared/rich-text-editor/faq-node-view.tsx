"use client";
// coding-standard: maintained
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Plus, X } from "lucide-react";
import { Button } from "@/ui/components/button";
import { FAQ_LIST_NODE, FAQ_ITEM_NODE, FAQ_QUESTION_NODE, FAQ_ANSWER_NODE } from "@/lib/storefront-rich-doc";

/**
 * Admin-editor chrome for the FAQ nodes (faq-node.ts). Styling here is
 * editor-only; the storefront look lives in rich-doc-faq-view.tsx.
 * All buttons are type="button" — the editor mounts inside DynamicForm's
 * <form>, where a bare <button> would submit it.
 */

/** JSON for a fresh empty Q&A pair — shared by insertFaqBlock and "+ Add question". */
export const emptyFaqItem = () => ({
  type: FAQ_ITEM_NODE,
  content: [
    { type: FAQ_QUESTION_NODE },
    { type: FAQ_ANSWER_NODE, content: [{ type: "paragraph" }] },
  ],
});

export function FaqListView({ editor, node, getPos }: NodeViewProps) {
  const addItem = () => {
    const pos = getPos();
    if (typeof pos !== "number") return;
    // Insert just before the faqList's closing token = append as last item.
    editor.chain().focus().insertContentAt(pos + node.nodeSize - 1, emptyFaqItem()).run();
  };
  return (
    <NodeViewWrapper className="my-3 rounded-lg border border-dashed border-border bg-muted/30 p-2">
      <NodeViewContent className="flex flex-col gap-2" />
      <div contentEditable={false} className="mt-2">
        <Button type="button" variant="ghost" size="sm" onClick={addItem} className="text-muted-foreground">
          <Plus /> Add question
        </Button>
      </div>
    </NodeViewWrapper>
  );
}

export function FaqItemView({ editor, node, getPos }: NodeViewProps) {
  const remove = () => {
    const pos = getPos();
    if (typeof pos !== "number") return;
    const $pos = editor.state.doc.resolve(pos);
    const parent = $pos.parent;
    // Last item: delete the whole faqList — its schema requires faqItem+, so
    // an empty list would be invalid.
    const range =
      parent.type.name === FAQ_LIST_NODE && parent.childCount <= 1
        ? { from: $pos.before($pos.depth), to: $pos.after($pos.depth) }
        : { from: pos, to: pos + node.nodeSize };
    editor.chain().focus().deleteRange(range).run();
  };
  return (
    <NodeViewWrapper className="relative rounded-md border border-border bg-card p-3 pr-9">
      <NodeViewContent />
      <div contentEditable={false} className="absolute top-1.5 right-1.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={remove}
          aria-label="Remove question"
          className="size-6 text-muted-foreground hover:text-destructive"
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </NodeViewWrapper>
  );
}

export function FaqQuestionView() {
  return (
    <NodeViewWrapper className="flex gap-2 text-sm font-semibold leading-6">
      <span contentEditable={false} className="select-none text-muted-foreground">
        Q.
      </span>
      <NodeViewContent className="min-w-0 flex-1" />
    </NodeViewWrapper>
  );
}
