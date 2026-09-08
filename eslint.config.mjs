import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import queryCache from './eslint-rules/query-cache.mjs'

const sanitizedNextVitals = nextVitals.map(config => {
  if (!config.ignores) return config
  return {
    ...config,
    ignores: config.ignores.filter(v => typeof v === 'string' || typeof v === 'function')
  }
})

/**
 * Query keys must come from the registry, never from a literal written at the use site.
 *
 * A literal like `["coupons"]` works only for as long as it happens to string-match the root some
 * other file chose. Rename the root and every literal silently stops matching — the query still
 * caches, the invalidation still "runs", and the screen just stops updating. That failure mode is
 * what `docs/plan/query-invalidation.md` was written about.
 *
 * Matches an array literal whose first element is a string literal, in the two positions that
 * matter: a `queryKey:` property, and the argument to `invalidateQueries`/`removeQueries`/
 * `setQueryData`/`getQueryData`. A key *derived* from the registry (`[...queryKeys.x.all(), id]`)
 * starts with a spread, so it passes.
 */
const QUERY_KEY_MESSAGE =
  'Query keys come from services/api/query-keys.ts — use queryKeys.<resource>.* instead of a literal. ' +
  'A literal only works while it happens to match the root; a rename breaks it silently.'

const QUERY_KEY_SELECTORS = [
  {
    selector: 'Property[key.name="queryKey"] > ArrayExpression > Literal:first-child',
    message: QUERY_KEY_MESSAGE,
  },
  {
    selector:
      'CallExpression[callee.property.name=/^(invalidateQueries|removeQueries|setQueryData|getQueryData)$/] ArrayExpression > Literal:first-child',
    message: QUERY_KEY_MESSAGE,
  },
]

/**
 * The soft half of the same convention. Warnings, not errors: each of these is usually wrong and
 * occasionally right, so it asks for a justification (`eslint-disable-next-line` **with a reason**)
 * instead of refusing. The hard rules are `noInlineQueryKeys` above and the mutation-coverage test
 * in `services/api/__tests__/invalidation.test.ts`.
 */
const queryCacheConventions = {
  files: ['**/*.ts', '**/*.tsx'],
  ignores: ['services/api/**/__tests__/**'],
  plugins: { 'query-cache': queryCache },
  rules: {
    'query-cache/no-blanket-invalidate': 'warn',
    'query-cache/no-cross-resource-invalidate': 'warn',
    'query-cache/no-raw-shopper-logout': 'warn',
  },
}

/**
 * A browser `Purchase` goes through `trackMetaPurchase`, never through a raw `fbq` call.
 *
 * The sale is always reported server-side through the Conversions API at the merchant's chosen
 * trigger. A merchant may ALSO enable the browser event (`browserEvents.purchase`, off by
 * default), and the two are only safe together because they share one deterministic `event_id`,
 * which is what lets Meta collapse them into a single conversion.
 *
 * Everything about that is easy to get wrong by hand and invisible when you do: omit the
 * `eventID` and every order is counted twice; build the id from `_id` instead of `orderNumber`
 * and it matches nothing the server sent; skip the store setting and every merchant starts
 * sending purchases they never asked for. `trackMetaPurchase` is the one place all three are
 * decided, so this rule keeps the ad-hoc route closed.
 *
 * (The window that made this a ban rather than a funnel is still real and still worth knowing:
 * Meta only deduplicates events received within 48 hours of each other, so the shared id covers
 * `pending` always, `confirmed` usually, and `delivered` rarely. It is now a documented choice
 * the merchant makes in the settings UI rather than one the frontend makes for them.)
 *
 * Matches the string reaching `fbq(...)` in any argument position. `lib/storefront-meta.ts` needs
 * no exemption: it passes the event name through as a variable, so no literal reaches `fbq`
 * there.
 */
const NO_BROWSER_PURCHASE_MESSAGE =
  'Do not hand `Purchase` to `fbq` directly — call `trackMetaPurchase` from lib/storefront-meta.ts. ' +
  'It is what applies the merchant\'s browserEvents.purchase setting and the shared event_id the ' +
  'server also sends; without that id Meta counts the sale twice. See backend docs/features/meta-pixel-capi.md.'

const META_PURCHASE_SELECTORS = [
  {
    selector: 'CallExpression[callee.name="fbq"] Literal[value="Purchase"]',
    message: NO_BROWSER_PURCHASE_MESSAGE,
  },
  {
    selector: 'CallExpression[callee.property.name="fbq"] Literal[value="Purchase"]',
    message: NO_BROWSER_PURCHASE_MESSAGE,
  },
]

/**
 * ONE config block owns `no-restricted-syntax`, and it has to stay that way.
 *
 * Flat config does not merge rule options — a later block naming the same rule REPLACES the
 * earlier one. Declaring the Meta selectors in their own block therefore silently switched the
 * query-key guard off across the whole repo: lint stayed green, and the protection was gone.
 * Add new selectors to an array above; never to a second block.
 */
const restrictedSyntax = {
  files: ['**/*.ts', '**/*.tsx'],
  rules: {
    'no-restricted-syntax': ['error', ...QUERY_KEY_SELECTORS, ...META_PURCHASE_SELECTORS],
  },
}

/**
 * The query-key registry itself, and the tests that assert on raw keys, legitimately write the
 * literals the rule forbids. They are exempted by RE-DECLARING the rule with only the Meta
 * selectors — not by an `ignores`, which would have to live on the shared block above and would
 * take the Meta guard down with it.
 */
const queryKeyRegistryExemption = {
  files: ['services/api/query-keys.ts', 'services/api/**/__tests__/**'],
  rules: {
    'no-restricted-syntax': ['error', ...META_PURCHASE_SELECTORS],
  },
}

const eslintConfig = defineConfig([
  ...sanitizedNextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
  {
    rules: {
      'react-compiler/react-compiler': 'off',
    }
  },
  restrictedSyntax,
  queryKeyRegistryExemption,
  queryCacheConventions,
])

export default eslintConfig
