// coding-standard: maintained
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Shadow test S29: a Bangla-only merchant could not read the order screens — not one of the
 * files here called `useTranslations`. Every merchant-visible string now comes from
 * `messages/{en,bn}/ecommerce.json`; this test keeps it that way by failing on English text
 * written straight into the order list, the order page and their dialogs.
 *
 * It reads the source with the TypeScript parser, so comments, types and class names never
 * trip it. What it treats as merchant-visible:
 * - text between JSX tags;
 * - `placeholder`, `title`, `aria-label`, `alt`, `label`, `description` string attributes;
 * - `label` / `description` / `title` / `placeholder` string properties (option lists, configs);
 * - string arguments to `toast.*(...)`.
 */
const ROOT = path.resolve(__dirname, "../../..");
const SOURCES = [
  ...fs
    .readdirSync(__dirname)
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.(ts|tsx)$/.test(f))
    .map((f) => path.join(__dirname, f)),
  path.join(ROOT, "app/(protected)/ecommerce/orders/page.tsx"),
  path.join(ROOT, "app/(protected)/ecommerce/orders/[id]/page.tsx"),
];

const VISIBLE_ATTRS = new Set(["placeholder", "title", "aria-label", "alt", "label", "description"]);
const VISIBLE_PROPS = new Set(["label", "description", "title", "placeholder", "header"]);
/** Names and symbols that are the same in every language. */
const ALLOWED = /^(COD|bKash|Nagad|Rocket|Pathao|Steadfast|eCourier|Messenger|WhatsApp|Instagram|Facebook|SMS|ID|OK)$/;

/** Text a reader would see as English: two or more Latin letters in a row, not an allowed name. */
const isEnglish = (text: string): boolean => {
  const words = text.match(/[A-Za-z]{2,}/g);
  return !!words && words.some((w) => !ALLOWED.test(w));
};

function findEnglish(file: string): string[] {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const hits: string[] = [];
  const report = (node: ts.Node, text: string) => {
    const { line } = source.getLineAndCharacterOfPosition(node.getStart());
    hits.push(`${path.relative(ROOT, file)}:${line + 1}  ${text.trim().slice(0, 70)}`);
  };
  /**
   * The literal text an expression can evaluate to: a string or template, either branch of a
   * ternary, either side of `??` / `||` / `+`. A call (`t("…")`, `formatMoney(…)`) yields none.
   */
  const stringsIn = (node: ts.Node | undefined): string[] => {
    if (!node) return [];
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
    if (ts.isTemplateExpression(node)) {
      return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
    }
    if (ts.isParenthesizedExpression(node)) return stringsIn(node.expression);
    if (ts.isConditionalExpression(node)) return [...stringsIn(node.whenTrue), ...stringsIn(node.whenFalse)];
    if (ts.isBinaryExpression(node)) {
      const op = node.operatorToken.kind;
      // `a ?? "x"`, `a || "x"`, `"x" + a` can render either side; `cond && "x"` only the right.
      // A comparison (`status === "pending"`) renders neither.
      if (
        op === ts.SyntaxKind.QuestionQuestionToken ||
        op === ts.SyntaxKind.BarBarToken ||
        op === ts.SyntaxKind.PlusToken
      ) {
        return [...stringsIn(node.left), ...stringsIn(node.right)];
      }
      if (op === ts.SyntaxKind.AmpersandAmpersandToken) return stringsIn(node.right);
    }
    return [];
  };
  const check = (node: ts.Node, expr: ts.Node | undefined) => {
    for (const text of stringsIn(expr)) if (isEnglish(text)) report(node, text);
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && isEnglish(node.text)) report(node, node.text);
    if (ts.isJsxAttribute(node) && VISIBLE_ATTRS.has(node.name.getText())) {
      const init = node.initializer;
      check(node, init && ts.isJsxExpression(init) ? init.expression : init);
    }
    if (ts.isPropertyAssignment(node) && VISIBLE_PROPS.has(node.name.getText())) {
      check(node, node.initializer);
    }
    // A prop's default text — \`cancelLabel = "Keep"\`.
    if (ts.isBindingElement(node) && /label|title|placeholder|description/i.test(node.name.getText())) {
      check(node, node.initializer);
    }
    if (ts.isCallExpression(node) && /^toast(\.\w+)?$/.test(node.expression.getText())) {
      check(node, node.arguments[0]);
    }
    // Text between tags written as an expression — `{"Other"}`, `{busy ? "Saving…" : "Save"}`.
    if (ts.isJsxExpression(node) && node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      check(node, node.expression);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}

describe("order screens have no hard-coded English (S29)", () => {
  it("every merchant-visible string comes from the message files", () => {
    const hits = SOURCES.flatMap(findEnglish);
    expect(hits, `English text left in the order screens:\n${hits.join("\n")}`).toEqual([]);
  });

  it("the detector itself catches the shapes it claims to", () => {
    const tmp = path.join(__dirname, "__probe__.tsx");
    fs.writeFileSync(
      tmp,
      `const a = <p>Return items</p>;\nconst b = <input placeholder="Pick a reason" />;\nconst c = { label: "Fake number" };\ntoast.error("Could not save");\nconst ok = <span>{t("x")} COD bKash ৳</span>;\n`,
    );
    try {
      expect(findEnglish(tmp)).toHaveLength(4);
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});
