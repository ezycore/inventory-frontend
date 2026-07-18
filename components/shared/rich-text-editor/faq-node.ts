// coding-standard: maintained
import { mergeAttributes, Node } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import { ReactNodeViewRenderer } from "@tiptap/react";
import {
  FAQ_ANSWER_NODE,
  FAQ_ITEM_NODE,
  FAQ_LIST_NODE,
  FAQ_QUESTION_NODE,
} from "@/lib/storefront-rich-doc";
import { emptyFaqItem, FaqItemView, FaqListView, FaqQuestionView } from "./faq-node-view";

/**
 * Custom TipTap nodes for the storefront FAQ cards (the rich-format successor
 * to the legacy markdown Q:/A: lines). Structure: faqList > faqItem+ >
 * (faqQuestion faqAnswer) — question is one inline run, answer is one
 * paragraph per line, both fully rich-text editable. `isolating` keeps
 * backspace/joins from dissolving a card into neighboring content.
 */

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    faqList: {
      /** Insert a fresh Q&A block (one empty item) at the cursor. */
      insertFaqBlock: () => ReturnType;
    };
  }
}

export const FaqQuestion = Node.create({
  name: FAQ_QUESTION_NODE,
  content: "inline*",
  marks: "bold italic link",
  defining: true,
  parseHTML() {
    return [{ tag: `div[data-type="${FAQ_QUESTION_NODE}"]` }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": FAQ_QUESTION_NODE }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FaqQuestionView);
  },
  addKeyboardShortcuts() {
    return {
      // Enter in the question jumps to its answer (the question can't split:
      // faqItem's content is fixed at exactly one question + one answer).
      Enter: () => {
        const { state, view } = this.editor;
        const { $from } = state.selection;
        if ($from.parent.type.name !== FAQ_QUESTION_NODE) return false;
        const selection = TextSelection.near(state.doc.resolve($from.after()), 1);
        view.dispatch(state.tr.setSelection(selection).scrollIntoView());
        return true;
      },
    };
  },
});

export const FaqAnswer = Node.create({
  name: FAQ_ANSWER_NODE,
  content: "paragraph+",
  defining: true,
  parseHTML() {
    return [{ tag: `div[data-type="${FAQ_ANSWER_NODE}"]` }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": FAQ_ANSWER_NODE, class: "rte-faq-answer" }),
      0,
    ];
  },
});

export const FaqItem = Node.create({
  name: FAQ_ITEM_NODE,
  content: `${FAQ_QUESTION_NODE} ${FAQ_ANSWER_NODE}`,
  isolating: true,
  defining: true,
  parseHTML() {
    return [{ tag: `div[data-type="${FAQ_ITEM_NODE}"]` }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": FAQ_ITEM_NODE }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FaqItemView);
  },
});

export const FaqList = Node.create({
  name: FAQ_LIST_NODE,
  group: "block",
  content: `${FAQ_ITEM_NODE}+`,
  isolating: true,
  defining: true,
  parseHTML() {
    return [{ tag: `div[data-type="${FAQ_LIST_NODE}"]` }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": FAQ_LIST_NODE }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FaqListView);
  },
  addCommands() {
    return {
      insertFaqBlock:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: FAQ_LIST_NODE, content: [emptyFaqItem()] }),
    };
  },
});
