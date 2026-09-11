// coding-standard: maintained
/**
 * Pasting rich content with emoji used to produce a full-width block image per
 * emoji: the providers ship them as `<img>` sprites, the schema has an `image`
 * node whose parse rule is `img[src]`, and its 100% width default plus the
 * editor's `display:block` rule did the rest. These pin both halves — the
 * string transform, and the document it actually yields through a real editor.
 */
import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import { richTextExtensions } from "./extensions";
import { inlinePastedEmojiImages } from "./paste-emoji";

const FB_EMOJI =
  '<img height="16" width="16" alt="\u{1F60A}" src="https://static.xx.fbcdn.net/images/emoji.php/v9/t4f/1/16/1f60a.png">';

describe("inlinePastedEmojiImages", () => {
  it("swaps a Facebook emoji sprite for its character", () => {
    expect(inlinePastedEmojiImages(`<p>Nice cushions ${FB_EMOJI}</p>`)).toBe(
      "<p>Nice cushions \u{1F60A}</p>",
    );
  });

  it("handles twemoji markup, where the class is the only tell", () => {
    const html =
      '<p>Hi <img class="emoji" draggable="false" alt="\u{1F44B}" src="https://abs.twimg.com/emoji/v2/72x72/1f44b.png"></p>';
    expect(inlinePastedEmojiImages(html)).toBe("<p>Hi \u{1F44B}</p>");
  });

  it("keeps multi-codepoint sequences whole", () => {
    // ZWJ family and a regional-indicator flag: several codepoints each, none
    // of which is an emoji on its own.
    const family = '<img alt="\u{1F468}\u200D\u{1F469}\u200D\u{1F467}" src="https://cdn.test/a.png">';
    const flag = '<img alt="\u{1F1E7}\u{1F1E9}" src="https://cdn.test/b.png">';
    expect(inlinePastedEmojiImages(`${family}${flag}`)).toBe(
      "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u{1F1E7}\u{1F1E9}",
    );
  });

  it("drops an emoji sprite that has no alt to recover", () => {
    const html = '<p>a<img class="notion-emoji" src="https://x.test/s.png">b</p>';
    expect(inlinePastedEmojiImages(html)).toBe("<p>ab</p>");
  });

  it("leaves a real content image alone", () => {
    const html = '<p><img src="https://cdn.test/cushion.webp" alt="Velvet cushion" width="900"></p>';
    expect(inlinePastedEmojiImages(html)).toBe(html);
  });

  it("does not mistake a digit alt for emoji", () => {
    // ASCII digits are Emoji_Component (keycap bases), so this is the case the
    // regex's lookahead exists to protect.
    const html = '<img src="https://cdn.test/chart.png" alt="1" width="800">';
    expect(inlinePastedEmojiImages(html)).toBe(html);
  });

  it("returns surrounding markup untouched, including bare fragments", () => {
    // ProseMirror re-wraps a spreadsheet's bare <tr> itself; normalising the
    // payload through a parser here would take that shape away from it.
    const html = `<tr><td>Size ${FB_EMOJI}</td></tr>`;
    expect(inlinePastedEmojiImages(html)).toBe("<tr><td>Size \u{1F60A}</td></tr>");
  });
});

describe("pasted emoji in the editor document", () => {
  const withEditor = (fn: (editor: Editor) => void) => {
    const element = document.createElement("div");
    document.body.appendChild(element);
    const editor = new Editor({ element, extensions: richTextExtensions });
    try {
      fn(editor);
    } finally {
      editor.destroy();
      element.remove();
    }
  };

  it("yields text, not an image node", () => {
    withEditor((editor) => {
      editor.commands.setContent(inlinePastedEmojiImages(`<p>Soft ${FB_EMOJI}</p>`));
      const json = JSON.parse(JSON.stringify(editor.getJSON()));
      const types = (json.content ?? []).map((n: { type: string }) => n.type);
      expect(types).not.toContain("image");
      expect(editor.getText()).toContain("\u{1F60A}");
    });
  });

  it("without the transform, the same paste becomes a 100%-wide image", () => {
    // Characterises the bug so the regression is visible if the wiring is lost.
    withEditor((editor) => {
      editor.commands.setContent(`<p>Soft ${FB_EMOJI}</p>`);
      const json = JSON.parse(JSON.stringify(editor.getJSON()));
      const image = (json.content ?? []).find((n: { type: string }) => n.type === "image");
      expect(image?.attrs).toMatchObject({ width: 100 });
    });
  });
});

describe("alt strings that only look like emoji", () => {
  it.each([
    ["a bare digit", "1"],
    ["a hash", "#"],
    ["a SKU", "SKU 12"],
  ])("leaves an image whose alt is %s", (_label, alt) => {
    const html = `<img src="https://cdn.test/p.png" alt="${alt}" width="800">`;
    expect(inlinePastedEmojiImages(html)).toBe(html);
  });

  it("still inlines a keycap, which is a digit plus an enclosing mark", () => {
    const html = '<img src="https://cdn.test/k.png" alt="1\uFE0F\u20E3">';
    expect(inlinePastedEmojiImages(html)).toBe("1\uFE0F\u20E3");
  });
});
