import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'

const sanitizedNextVitals = nextVitals.map(config => {
  if (!config.ignores) return config
  return {
    ...config,
    ignores: config.ignores.filter(v => typeof v === 'string' || typeof v === 'function')
  }
})

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
])
 
export default eslintConfig