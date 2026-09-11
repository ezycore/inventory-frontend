// coding-standard: maintained
/**
 * The editor's extension set.
 *
 * Two invariants, both of which fail silently when broken:
 *
 * 1. History/cursor extensions are PRESENT. ProseMirror ships no undo of its
 *    own — without `UndoRedo`, Cmd+Z does nothing at all, and the browser's
 *    native undo cannot reach a contenteditable ProseMirror manages. Nothing
 *    errors; the keystroke is simply inert, and a merchant loses a paragraph.
 * 2. They add NO nodes and NO marks. `extensions.ts` is deliberately restricted
 *    to what `rich-doc-view.tsx` can draw, because an extension whose node the
 *    renderer does not know makes content vanish on the shop. These three are
 *    the exception to that rule, and this asserts they stay the exception.
 */
import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import { richTextExtensions } from "./extensions";

const names = richTextExtensions.map((e) => e.name);
const byName = (n: string) => richTextExtensions.find((e) => e.name === n);

describe("richTextExtensions", () => {
  it.each(["undoRedo", "gapCursor", "dropCursor", "characterCount", "trailingNode"])(
    "registers %s",
    (name) => {
      expect(names).toContain(name);
    },
  );

  it("keeps them free of nodes and marks", () => {
    for (const name of [
      "undoRedo",
      "gapCursor",
      "dropCursor",
      "characterCount",
      "trailingNode",
    ]) {
      // `type` is "extension" for behaviour-only additions; "node" or "mark"
      // would mean the renderer has something new to learn.
      expect(byName(name)?.type, name).toBe("extension");
    }
  });

  // Guards the ordering note in the file: Color writes its value as an attr on
  // the textStyle mark, so TextStyle has to be registered first.
  it("registers TextStyle before Color", () => {
    expect(names.indexOf("textStyle")).toBeLessThan(names.indexOf("color"));
  });

  it("registers no extension twice", () => {
    expect(new Set(names).size).toBe(names.length);
  });
});

/**
 * Registration is not the same as working, and this is a data-loss fix — so it
 * drives a real `Editor` rather than asserting the array contains a name.
 */
describe("undo/redo behaviour", () => {
  const mount = (text: string) => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    return new Editor({
      element,
      extensions: richTextExtensions,
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text }] }],
      },
    });
  };

  it("restores the previous document, and redo puts it back", () => {
    const editor = mount("one");
    try {
      editor.commands.insertContent(" two");
      expect(editor.getText()).toContain("two");

      expect(editor.can().undo()).toBe(true);
      editor.commands.undo();
      expect(editor.getText()).toBe("one");

      expect(editor.can().redo()).toBe(true);
      editor.commands.redo();
      expect(editor.getText()).toContain("two");
    } finally {
      editor.destroy();
    }
  });

  // Drives the toolbar's disabled state — a fresh document must not offer an
  // undo that would do nothing.
  it("reports nothing to undo on a fresh document", () => {
    const editor = mount("one");
    try {
      expect(editor.can().undo()).toBe(false);
      expect(editor.can().redo()).toBe(false);
    } finally {
      editor.destroy();
    }
  });
});

/**
 * Image geometry, driven through a real editor.
 *
 * The unit tests on the renderer prove it DRAWS a width and an alignment; this
 * proves the editor actually stores them, which is the half that a hand-written
 * `addAttributes` gets wrong silently — a missing `renderHTML`/`parseHTML` pair
 * still type-checks and still round-trips through `getJSON`, right up until it
 * does not.
 */
describe("image width/align attributes", () => {
  const mountImage = () => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    const editor = new Editor({ element, extensions: richTextExtensions });
    editor.commands.setImage({ src: "https://cdn.test/a.webp" });
    return editor;
  };

  const imageNode = (editor: Editor) =>
    (editor.getJSON().content ?? []).find((n: any) => n.type === "image") as any;

  it("defaults to full width, centred", () => {
    const editor = mountImage();
    try {
      expect(imageNode(editor).attrs).toMatchObject({ width: 100, align: "center" });
    } finally {
      editor.destroy();
    }
  });

  it("stores a chosen width and alignment", () => {
    const editor = mountImage();
    try {
      editor.commands.updateAttributes("image", { width: 25, align: "left" });
      expect(imageNode(editor).attrs).toMatchObject({ width: 25, align: "left" });
    } finally {
      editor.destroy();
    }
  });

  it("keeps an empty alt as an empty string, not undefined", () => {
    const editor = mountImage();
    try {
      editor.commands.updateAttributes("image", { alt: "" });
      expect(imageNode(editor).attrs.alt).toBe("");
    } finally {
      editor.destroy();
    }
  });

  // Serialization is what actually reaches the database.
  it("survives a JSON round trip", () => {
    const editor = mountImage();
    try {
      editor.commands.updateAttributes("image", { width: 50, align: "right" });
      const json = JSON.parse(JSON.stringify(editor.getJSON()));
      const image = json.content.find((n: any) => n.type === "image");
      expect(image.attrs).toMatchObject({ width: 50, align: "right" });
    } finally {
      editor.destroy();
    }
  });
  it("stores the wrap flag and round-trips it", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    const editor = new Editor({ element, extensions: richTextExtensions });
    try {
      editor.commands.setImage({ src: "https://cdn.test/a.webp" });
      editor.commands.updateAttributes("image", { wrap: true, align: "right", width: 50 });
      const json = JSON.parse(JSON.stringify(editor.getJSON()));
      const image = json.content.find((n: any) => n.type === "image");
      expect(image.attrs).toMatchObject({ wrap: true, align: "right", width: 50 });
    } finally {
      editor.destroy();
    }
  });

  it("defaults wrap off, so an image keeps its own line", () => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    const editor = new Editor({ element, extensions: richTextExtensions });
    try {
      editor.commands.setImage({ src: "https://cdn.test/a.webp" });
      const image = (editor.getJSON().content ?? []).find(
        (n: any) => n.type === "image",
      ) as any;
      expect(image.attrs.wrap).toBe(false);
    } finally {
      editor.destroy();
    }
  });
});
