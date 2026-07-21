// coding-standard: maintained
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { CALLOUT_NODE, type RichDocCalloutVariant } from "@/lib/storefront-rich-doc";
import { CalloutView } from "./callout-node-view";

/**
 * Custom TipTap node for storefront callout / notice boxes (shipping notes,
 * policy warnings). `paragraph+` content, a `variant` attr (info/warning/
 * success), `isolating` so backspace can't dissolve it into a neighbour.
 */
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Insert an empty callout of the given variant at the cursor. */
      insertCallout: (variant?: RichDocCalloutVariant) => ReturnType;
      /** Change the variant of the callout the cursor is in. */
      setCalloutVariant: (variant: RichDocCalloutVariant) => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: CALLOUT_NODE,
  group: "block",
  content: "paragraph+",
  isolating: true,
  defining: true,
  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el) => el.getAttribute("data-variant") ?? "info",
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    };
  },
  parseHTML() {
    return [{ tag: `div[data-type="${CALLOUT_NODE}"]` }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": CALLOUT_NODE }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
  addCommands() {
    return {
      insertCallout:
        (variant = "info") =>
        ({ commands }) =>
          commands.insertContent({
            type: CALLOUT_NODE,
            attrs: { variant },
            content: [{ type: "paragraph" }],
          }),
      setCalloutVariant:
        (variant) =>
        ({ commands }) =>
          commands.updateAttributes(CALLOUT_NODE, { variant }),
    };
  },
});
