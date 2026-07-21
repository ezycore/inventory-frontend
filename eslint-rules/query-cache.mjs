/**
 * Local ESLint rules for the query-cache conventions in `docs/plan/query-invalidation.md`.
 *
 * These are **warnings**, not errors, and that is the point. The two hard rules — no inline key
 * literals (ESLint `no-restricted-syntax`), no mutation without invalidation
 * (`services/api/__tests__/invalidation.test.ts`) — are mechanical, so they block. What is below is
 * judgement: each one is *usually* wrong and occasionally right, so it asks for a justification
 * rather than refusing. Silence one with an `eslint-disable-next-line` **and a reason**.
 *
 * They live in their own rule objects because a single `no-restricted-syntax` entry carries one
 * severity for all its selectors, and flat config lets a later block replace the rule wholesale —
 * so the hard rule and these soft ones cannot share it.
 */

/** Does this subtree mention `queryKeys.<something>`? Returns the root names it names. */
const queryKeyRoots = (node) => {
  const roots = new Set();
  const walk = (n) => {
    if (!n || typeof n !== "object") return;
    if (
      n.type === "MemberExpression" &&
      n.object?.type === "MemberExpression" &&
      n.object.object?.type === "Identifier" &&
      n.object.object.name === "queryKeys" &&
      n.object.property?.type === "Identifier"
    ) {
      roots.add(n.object.property.name);
    }
    for (const key of Object.keys(n)) {
      if (key === "parent") continue;
      const child = n[key];
      if (Array.isArray(child)) child.forEach(walk);
      else if (child && typeof child.type === "string") walk(child);
    }
  };
  walk(node);
  return roots;
};

const isInvalidateQueries = (node) =>
  node.type === "CallExpression" &&
  node.callee.type === "MemberExpression" &&
  node.callee.property?.type === "Identifier" &&
  node.callee.property.name === "invalidateQueries";

export const rules = {
  /**
   * `queryClient.invalidateQueries()` with no key refetches every mounted query in the app. It is
   * occasionally correct — login, signup, and wiping demo data really do change everything — and
   * otherwise it is a shrug where an event belonged.
   */
  "no-blanket-invalidate": {
    meta: {
      type: "suggestion",
      docs: { description: "Flag an argument-less invalidateQueries() as an unscoped cache flush" },
      schema: [],
      messages: {
        blanket:
          "invalidateQueries() with no key refetches every mounted query. Use " +
          'invalidate(qc, "<event>") from services/api/invalidation.ts. If you really do mean ' +
          "everything (login, signup, demo-data wipe), disable this line with a reason.",
      },
    },
    create(context) {
      return {
        CallExpression(node) {
          if (isInvalidateQueries(node) && node.arguments.length === 0) {
            context.report({ node, messageId: "blanket" });
          }
        },
      };
    },
  },

  /**
   * A mutation handler that invalidates two *different* resources is re-deriving the dependency
   * graph at the call site — the exact habit that left the storefront order pipeline posting Sales
   * without refreshing sales, inventory or accounts. Flushing your own resource's root and its
   * detail is fine; both are the same root, so this stays quiet.
   */
  "no-cross-resource-invalidate": {
    meta: {
      type: "suggestion",
      docs: { description: "Flag a handler that hand-lists more than one resource's keys" },
      schema: [],
      messages: {
        crossResource:
          "This handler invalidates {{roots}} — more than one resource, hand-listed at the call " +
          'site. Declare the effect once in services/api/invalidation.ts and call invalidate(qc, "<event>").',
      },
    },
    create(context) {
      /** One frame per function body; collects the roots named by its invalidateQueries calls. */
      const stack = [];

      const enter = () => stack.push(new Map());
      const exit = () => {
        const found = stack.pop();
        if (!found || found.size < 2) return;
        const [firstNode] = found.values();
        context.report({
          node: firstNode,
          messageId: "crossResource",
          data: { roots: [...found.keys()].sort().join(", ") },
        });
      };

      return {
        FunctionExpression: enter,
        ArrowFunctionExpression: enter,
        FunctionDeclaration: enter,
        "FunctionExpression:exit": exit,
        "ArrowFunctionExpression:exit": exit,
        "FunctionDeclaration:exit": exit,
        CallExpression(node) {
          if (!isInvalidateQueries(node) || stack.length === 0) return;
          const frame = stack[stack.length - 1];
          for (const root of queryKeyRoots(node)) {
            if (!frame.has(root)) frame.set(root, node);
          }
        },
      };
    },
  },

  /**
   * `useShopperStore().logout` clears the shopper's token and leaves their orders in the cache, so
   * the next sign-in on the same device can read them back. `useShopperLogout(slug)` evicts too.
   * Sanctioned inside the two files that implement the eviction itself.
   */
  "no-raw-shopper-logout": {
    meta: {
      type: "problem",
      docs: { description: "Require useShopperLogout over the raw shopper store logout action" },
      schema: [],
      messages: {
        rawLogout:
          "Use useShopperLogout(slug) from services/storefront/hooks.ts. The raw store action " +
          "clears the token but not the cache, so the next shopper on this device can be served " +
          "the previous one's orders.",
      },
    },
    create(context) {
      const filename = context.filename ?? context.getFilename();
      const sanctioned =
        filename.includes("services/storefront/hooks.ts") ||
        filename.includes("lib/storefront-client.ts") ||
        filename.includes("use-shopper-store.ts");
      if (sanctioned) return {};

      return {
        MemberExpression(node) {
          if (node.property?.type !== "Identifier" || node.property.name !== "logout") return;
          const source = context.sourceCode ?? context.getSourceCode();
          // `useShopperStore((s) => s.logout)` and `useShopperStore.getState().logout()` both read
          // as a `.logout` inside an expression that mentions the shopper store.
          let scope = node;
          for (let depth = 0; depth < 6 && scope.parent; depth += 1) scope = scope.parent;
          if (source.getText(scope).includes("useShopperStore")) {
            context.report({ node, messageId: "rawLogout" });
          }
        },
      };
    },
  },
};

const plugin = { rules };
export default plugin;
