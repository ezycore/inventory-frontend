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

const noInlineQueryKeys = {
  files: ['**/*.ts', '**/*.tsx'],
  ignores: ['services/api/query-keys.ts', 'services/api/**/__tests__/**'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Property[key.name="queryKey"] > ArrayExpression > Literal:first-child',
        message: QUERY_KEY_MESSAGE,
      },
      {
        selector:
          'CallExpression[callee.property.name=/^(invalidateQueries|removeQueries|setQueryData|getQueryData)$/] ArrayExpression > Literal:first-child',
        message: QUERY_KEY_MESSAGE,
      },
    ],
  },
}

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
  noInlineQueryKeys,
  queryCacheConventions,
])

export default eslintConfig
