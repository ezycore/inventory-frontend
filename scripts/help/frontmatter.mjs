// coding-standard: maintained
/**
 * Shared frontmatter reader for the customer help docs.
 *
 * Two scripts need it — `verify-help-docs.mjs` (the CI gate) and `build-help-content.mjs` (the
 * generator). They must agree exactly on what a page declares, or the gate would verify one thing
 * and the app would ship another.
 *
 * The subset help pages use is scalars and `- ` lists, so a YAML dependency would buy nothing and
 * this stays runnable with zero installs.
 */

/** `"x"` / `'x'` → `x`. Values are otherwise taken literally. */
export function stripQuotes(value) {
  return value.replace(/^["'](.*)["']$/, "$1");
}

/**
 * Split a page into its declared fields and its Markdown body.
 * Returns `null` when the file has no frontmatter block, leaving the caller to report it.
 */
export function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;

  const [, head, body] = match;
  const data = {};
  let currentKey = null;

  for (const line of head.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;

    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && currentKey) {
      data[currentKey].push(stripQuotes(listItem[1].trim()));
      continue;
    }

    const pair = line.match(/^([A-Za-z_][\w]*):\s*(.*)$/);
    if (!pair) continue;

    const [, key, value] = pair;
    if (value.trim() === "") {
      data[key] = [];
      currentKey = key;
    } else {
      data[key] = stripQuotes(value.trim());
      currentKey = null;
    }
  }

  return { data, body };
}
