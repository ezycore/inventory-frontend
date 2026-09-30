// coding-standard: maintained
/**
 * The gate that keeps `docs/plan/query-invalidation.md` from happening again.
 *
 * Two classes of regression are caught here, both of which used to ship silently:
 *
 *  1. A mutation hook that invalidates nothing — the "in many places it isn't implemented at all"
 *     half of the original complaint. Every exported `use*` hook containing `useMutation` must
 *     either invalidate something or be listed in `READ_ONLY_MUTATIONS` **with a reason**.
 *  2. An `EFFECTS` entry that is empty or names a key no resource owns, which would make
 *     `invalidate(qc, event)` a confident no-op.
 *
 * This is a source-text test on purpose. The alternative — rendering every hook and asserting on a
 * spied QueryClient — needs a provider, an API mock and a component per hook, and would still not
 * see a hook nobody remembered to wire up. Reading the files finds the gap whether or not anyone
 * wrote a test for that module.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { EFFECTS, type DomainEvent } from "../invalidation";
import { queryKeys } from "../query-keys";
import {
  OPTION_SOURCES,
  optionSourceRoot,
  selectOptions,
  type OptionSourceName,
} from "../select-options";

const SERVICES_DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const MODULES_DIR = path.join(SERVICES_DIR, "api", "modules");
/** The shopper surface: its own key space and session model, but the same rule about mutations. */
const STOREFRONT_HOOKS = path.join(SERVICES_DIR, "storefront", "hooks.ts");

/**
 * Mutations used for their *response*, not their effect: a quote, a probe, an email send. They
 * change no server state this app caches, so invalidating anything would be a wasted refetch.
 * Adding a name here is a claim — if the endpoint writes something, it does not belong.
 */
const READ_ONLY_MUTATIONS: Record<string, string> = {
  useEndOwnSupportSession:
    "the support operator ending their own session — it clears the local auth, " +
    "so every cached query is discarded with the session rather than refreshed",
  useEmailCustomerStatement: "sends an email; changes no data",
  useEmailSaleReceipt: "sends an email; changes no data",
  useOrderFraudScore: "on-demand risk lookup, modelled as a mutation to run lazily",
  useCourierPrice: "pre-dispatch price quote",
  useTestCourier: "credential probe",
  useCourierStores: "reads the provider's store list",
  useCourierPackages: "reads the provider's package list",
  useMe: "re-reads the session into the auth store; the store is not query state",
  useLogout: "clears auth; the cache is cleared by the logout flow itself",
  useImportPreview: "dry run — nothing is committed",
  useMatchProductList: "resolves pasted names/barcodes to product ids; writes nothing",

  // Pre-login flows. Nothing is cached before there is a session to cache it against.
  useVerifyEmail: "pre-login; no cached state exists yet",
  useResendVerification: "sends an email; changes no data",
  useForgotPassword: "sends an email; changes no data",
  useResetPassword: "pre-login; the user is sent to /login afterwards",

  // Modelled as mutations so they run on click rather than on mount — they are reads.
  useOrganizationUsers: "lazy read of the org's user list",
  useEnable2FA: "returns the enrolment secret; the status query is written on verify",

  useUpdatePassword: "changes a credential, not anything this app caches",
  useUploadStorefrontImage:
    "returns a URL for the form to hold; the storefront settings save is what persists it",
  useRequestPayLink: "sends a billing email; the entitlement is unchanged until MC pushes it",

  // ── Shopper storefront (services/storefront/hooks.ts) ───────────────────────────────────────
  // Writes the persisted zustand shopper rather than the query cache: every one of these endpoints
  // returns the full refreshed profile, and the storefront reads addresses and preferences from
  // that store, not from a query. `useShopperAuth` is *not* listed — it evicts via
  // `clearShopperCache`, which is the session-change rule, not an exemption from it.
  useShopperAccount:
    "profile/prefs/address writes replace the persisted shopper; nothing reads them from a query",
};

/** Every `hooks.ts` under `services/api/modules/`, recursively. */
const hookFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return hookFiles(full);
    return entry.name.endsWith("hooks.ts") ? [full] : [];
  });

/** Split a hooks file into `export const useX = …` / `export function useX(…)` blocks. */
const exportedHooks = (source: string) => {
  const parts = source.split(/(?=^export (?:const|function) use\w)/m);
  return parts
    .map((block) => ({
      name: block.match(/^export (?:const|function) (use\w+)/)?.[1],
      block,
    }))
    .filter((h): h is { name: string; block: string } => Boolean(h.name));
};

describe("EFFECTS", () => {
  const events = Object.keys(EFFECTS) as DomainEvent[];

  it("declares at least one key for every event", () => {
    for (const event of events) {
      expect(EFFECTS[event].length, `"${event}" invalidates nothing`).toBeGreaterThan(0);
    }
  });

  it("only names keys that some resource in the registry owns", () => {
    // Every root the registry can produce. A key whose first segment is not among them is a
    // hand-written literal that no query will ever match.
    const roots = new Set(
      Object.values(queryKeys).flatMap((resource) => {
        const all = (resource as { all?: () => readonly unknown[] }).all;
        return typeof all === "function" ? [String(all()[0])] : [];
      }),
    );

    for (const event of events) {
      for (const key of EFFECTS[event]) {
        const root = String((key as readonly unknown[])[0]);
        expect(roots.has(root), `"${event}" invalidates unknown root "${root}"`).toBe(true);
      }
    }
  });

  /**
   * Recording a courier's statement and posting it are separate events, and the difference is
   * the ledger.
   *
   * `recordPayout` files the statement and stamps the parcels; no money moves, because the
   * destination account is the merchant's to choose. `postPayout` writes the transfer and the
   * expense rows. Collapsing them into one event costs a full ledger refetch on every filing —
   * and the nightly sweep files in bulk, so that is not a rare path.
   */
  it("a recorded courier payment moves the ledger and the payouts screen together", () => {
    const money = new Set(
      [queryKeys.accounts.all(), queryKeys.transactions.all()].map((key) =>
        JSON.stringify(key),
      ),
    );
    const posted = EFFECTS["payout.posted"].map((key) => JSON.stringify(key));
    expect(posted.filter((key) => money.has(key))).toHaveLength(money.size);
    expect(posted).toContain(JSON.stringify(queryKeys.courierPayouts.all()));
  });

  it("a settled order refreshes the courier balance — delivery settles into clearing", () => {
    const settled = EFFECTS["order.settled"].map((key) => JSON.stringify(key));
    expect(settled).toContain(JSON.stringify(queryKeys.courierPayouts.all()));
  });

  it("has no duplicate keys within a single event", () => {
    for (const event of events) {
      const serialized = EFFECTS[event].map((key) => JSON.stringify(key));
      expect(new Set(serialized).size, `"${event}" lists a key twice`).toBe(serialized.length);
    }
  });
});

describe("select-option sources", () => {
  const names = Object.keys(OPTION_SOURCES) as OptionSourceName[];

  it("round-trips: every source's own URL resolves back to its own root", () => {
    // The property that makes a dropdown refresh. If a path stops resolving — a renamed route, a
    // new source that shadows an existing prefix — the dropdown silently detaches from its
    // resource, which is defect A4 all over again.
    for (const name of names) {
      const expected = JSON.stringify(OPTION_SOURCES[name].root());
      const actual = JSON.stringify(optionSourceRoot(selectOptions(name)));
      expect(actual, `"${name}" resolves to the wrong root`).toBe(expected);
    }
  });

  it("resolves a source's URL the same way whatever projection it asks for", () => {
    for (const name of names) {
      const plain = JSON.stringify(optionSourceRoot(selectOptions(name)));
      const projected = JSON.stringify(
        optionSourceRoot(selectOptions(name, { fields: "_id,name", status: "active" })),
      );
      expect(projected, `"${name}" is projection-sensitive`).toBe(plain);
    }
  });

  it("resolves a substituted path template", () => {
    // The form renderer swaps `{{_id}}` for a real id before the fetch; both spellings must land
    // on the same root or the dropdown loses its invalidation the moment it is used for real.
    const template = optionSourceRoot("/products/{{_id}}/variants?fields=_id,attributes");
    const substituted = optionSourceRoot("/products/abc123/variants?fields=_id,attributes");
    expect(JSON.stringify(substituted)).toBe(JSON.stringify(template));
    expect(JSON.stringify(template)).toBe(JSON.stringify(queryKeys.products.all()));
  });

  it("returns undefined for an unregistered path, so the hook can warn", () => {
    expect(optionSourceRoot("/not-a-real-resource?all=true")).toBeUndefined();
  });

  it("defaults to all=true except where the endpoint is already a bounded list", () => {
    expect(selectOptions("brands")).toBe("/brands?all=true");
    expect(selectOptions("sellableProducts")).toBe("/inventory/sellable-products");
    expect(selectOptions("brands", { all: false })).toBe("/brands");
  });
});

describe("every mutation hook invalidates something", () => {
  const files = [...hookFiles(MODULES_DIR), STOREFRONT_HOOKS];

  it("finds the hook modules", () => {
    expect(files.length).toBeGreaterThan(20);
    expect(fs.existsSync(STOREFRONT_HOOKS)).toBe(true);
  });

  for (const file of files) {
    const relative = path.relative(SERVICES_DIR, file);
    const source = fs.readFileSync(file, "utf8");

    for (const { name, block } of exportedHooks(source)) {
      if (!block.includes("useMutation")) continue;

      it(`${relative} → ${name}`, () => {
        // `setQueryData` counts: seeding the cache with the server's response is a *stronger*
        // guarantee than invalidating, not a missing one.
        const invalidates =
          /\binvalidate\(\s*(queryClient|qc)\b/.test(block) ||
          /\binvalidateQueries\(/.test(block) ||
          /\bsetQueryData\(/.test(block) ||
          /\bclearShopperCache\(/.test(block) ||
          /\.clear\(\)/.test(block);

        expect(
          invalidates || name in READ_ONLY_MUTATIONS,
          `${name} runs a mutation but invalidates nothing. Either call ` +
            `invalidate(qc, "<event>") from services/api/invalidation.ts, or add it to ` +
            `READ_ONLY_MUTATIONS in this file with a reason.`,
        ).toBe(true);
      });
    }
  }
});

/**
 * A mutation must refresh the list **its own module reads**.
 *
 * The existing gates catch a mutation that invalidates *nothing*, and an event
 * that names a key no resource owns. Neither can see the third shape: a mutation
 * that fires a real event carrying real keys, none of which is the key this
 * module's own `useQuery` reads. It is the most convincing kind of wrong —
 * `invalidate()` is right there in the hook — and it shipped: creating a
 * storefront content page fired `storefront.catalog.changed`, whose four keys are
 * catalog/campaign/coupon/dashboard, so the page list kept showing the previous
 * set until the merchant reloaded.
 *
 * Source-text, for the same reason as the gates above: it finds the gap in a
 * module nobody wrote a test for.
 */
const FOREIGN_READS: Record<string, string> = {
  // The dispatch UI reads the courier CONFIG to build its picker. Moving an
  // order does not change which couriers the merchant has set up, so an order
  // mutation has no business refetching them.
  "storefront-orders": "reads courier config for the dispatch picker; orders never dirty it",
};

describe("a module's mutations refresh the lists that module reads", () => {
  /** event → the query-key roots it invalidates. */
  const rootsByEvent = new Map<string, Set<string>>(
    (Object.keys(EFFECTS) as DomainEvent[]).map((event) => [
      event,
      new Set(EFFECTS[event].map((key) => String((key as readonly unknown[])[0]))),
    ]),
  );

  /** `queryKeys.storefrontPages` → its root string. */
  const rootOf = (property: string): string | undefined => {
    const resource = (queryKeys as Record<string, unknown>)[property] as
      | { all?: () => readonly unknown[] }
      | undefined;
    return typeof resource?.all === "function" ? String(resource.all()[0]) : undefined;
  };

  it.each(hookFiles(MODULES_DIR).map((file) => [path.basename(path.dirname(file)), file]))(
    "%s",
    (moduleName: string, file: string) => {
      const source = fs.readFileSync(file, "utf8");
      if (!source.includes("useMutation")) return;

      const fired = [...source.matchAll(/invalidate\(\s*qc\s*,([^;]*?)\)/g)].flatMap(
        (call) => [...call[1].matchAll(/"([a-z0-9.]+)"/gi)].map((e) => e[1]),
      );
      if (fired.length === 0) return; // covered by the "invalidates something" gate

      const covered = new Set<string>();
      for (const event of fired) {
        for (const root of rootsByEvent.get(event) ?? []) covered.add(root);
      }

      const read = new Set(
        [...source.matchAll(/queryKeys\.(\w+)\./g)]
          .map((match) => rootOf(match[1]))
          .filter((root): root is string => Boolean(root)),
      );

      const missing = [...read].filter((root) => !covered.has(root));
      expect(
        missing,
        `${moduleName} queries [${missing}] but none of its events (${[...new Set(fired)]}) ` +
          `invalidates them — a mutation here leaves its own list stale. Add the key to an ` +
          `event, or list the module in FOREIGN_READS with a reason.`,
      ).toEqual(FOREIGN_READS[moduleName] ? missing : []);
    },
  );
});
