// coding-standard: maintained

/**
 * Paste sanitiser for emoji that arrive as `<img>` elements.
 *
 * Facebook, Twitter/X (twemoji), Slack, Notion and GitHub all render emoji in
 * their own UI as small sprite images, not as text. Copy a post from any of
 * them and the clipboard's HTML flavour carries
 * `<img src="https://static.xx.fbcdn.net/images/emoji.php/…" alt="😊">`.
 *
 * Our schema has a real `image` node, and its parse rule is `img[src]` — so
 * ProseMirror faithfully turns each 16px emoji into a BODY IMAGE. It then picks
 * up the node's `width` default of 100, which `image-node.ts` renders as
 * `style="width:100%"`, and `rich-text-editor.css` draws every `img` as
 * `display:block`. A smiley pasted mid-sentence becomes a full-column block
 * image. That is the "emoji is huge after pasting" report; pasting as plain
 * text avoids it only because the plain-text flavour never had the `<img>`.
 *
 * The fix is to spend the `alt`: these sprites carry the actual emoji character
 * in it, so swapping the tag for its `alt` restores exactly what the merchant
 * thought they were copying — real text, in the paragraph's own font size, and
 * with no hotlink to a third-party CDN stored in the product description.
 */

/**
 * True for an `alt` that is *entirely* emoji.
 *
 * Two clauses, and both are load-bearing.
 *
 * The character class is permissive because a single emoji is routinely several
 * codepoints: `Emoji_Component` is what supplies the ZWJ, variation selector 16,
 * skin-tone modifiers, regional indicators and keycap mark that join them into
 * 👨‍👩‍👧 or 🇧🇩.
 *
 * The lookahead then takes back the part of that class which is plain ASCII —
 * `Emoji_Component` also covers `0`–`9`, `#` and `*`, because those are the
 * bases of keycap sequences. So the string must additionally contain at least
 * one character that can only be emoji: a pictograph, a regional indicator, or
 * the enclosing keycap mark. Without it, `alt="1"` on a genuine product image
 * would read as emoji and the image would be destroyed. Note that a flag has no
 * pictograph at all — requiring `Extended_Pictographic` alone is not enough.
 */
// The required character is an ALTERNATION, not a character class: a class
// mixing the keycap mark (a combining character) with ordinary codepoints trips
// `no-misleading-character-class`, and the rule has a point — a class like that
// reads as if it matched whole emoji when it matches single codepoints. Here
// single codepoints are exactly the question ("does the string contain one of
// these at all"), so the alternation states that rather than hiding it.
//
// Mirrored in `inventory-backend`'s `utils/rich-doc-emoji.ts`, which audits the
// bodies stored before this transform existed. Keep the two in step.
const EMOJI_ONLY_ALT =
  /^(?=[\s\S]*(?:\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|\u{20E3}))[\p{Extended_Pictographic}\p{Emoji_Component}\s]+$/u;

/** Matches a whole `<img …>` tag, self-closing or not. */
const IMG_TAG = /<img\b[^>]*>/gi;

/**
 * A sprite we recognise as an emoji but which carries no `alt` to recover.
 * There is no text to put back, so the only choices are "drop it" and "leave a
 * full-width block image of a smiley in the description" — dropping wins.
 */
function isUnlabelledEmojiSprite(img: HTMLImageElement): boolean {
  if (/(^|[\s_-])emoji/i.test(img.getAttribute("class") ?? "")) return true;
  if (/emoji|twemoji/i.test(img.getAttribute("src") ?? "")) return true;
  // A declared box this small is an icon by definition — nothing a merchant
  // would knowingly place as a body image is 32px wide.
  const width = Number(img.getAttribute("width"));
  const height = Number(img.getAttribute("height"));
  return (width > 0 && width <= 32) || (height > 0 && height <= 32);
}

/**
 * Parses ONE tag in isolation to read its attributes properly (quoting, entity
 * decoding, duplicate attributes — all the things an attribute regex gets
 * wrong). A `DOMParser` document has no browsing context, so nothing here
 * fetches the sprite's URL.
 */
function readImgTag(tag: string): HTMLImageElement | null {
  return new DOMParser()
    .parseFromString(tag, "text/html")
    .querySelector("img");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * ProseMirror `transformPastedHTML`. Wired up in `use-rich-text-content.ts`.
 *
 * Rewrites only the `<img>` tags it recognises and returns the rest of the
 * pasted string untouched, byte for byte. That is deliberate — it must not
 * round-trip the whole clipboard payload through a parser, because ProseMirror
 * still needs to see fragments in their original shape (a bare `<tr>` from a
 * spreadsheet copy, say, which it detects and re-wraps in a table itself).
 */
export function inlinePastedEmojiImages(html: string): string {
  if (!html.includes("<img")) return html;
  return html.replace(IMG_TAG, (tag) => {
    const img = readImgTag(tag);
    if (!img) return tag;
    const alt = (img.getAttribute("alt") ?? "").trim();
    if (EMOJI_ONLY_ALT.test(alt)) return escapeText(alt);
    return isUnlabelledEmojiSprite(img) ? "" : tag;
  });
}
