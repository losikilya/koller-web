// ESLint 8: keep the installed CRA lint baseline; Prettier owns formatting.
module.exports = {
  root: true,
  extends: ['react-app', 'react-app/jest'],
  plugins: ['import-x'],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '**/.next/',
    '**/next-env.d.ts',
    '.pnpm-store/',
    '.turbo/',
    'build/',
    'coverage/',
    'ci-reports/',
    'test-results/',
    'playwright-report/',
    '.features-gen/',
    '.opencode/',
    '.claude/',
    '.agents/',
    '.codex/',
  ],
  settings: {
    'import-x/resolver': { typescript: {project:['tsconfig.json','apps/web/tsconfig.json','packages/*/tsconfig.json']} },
    'import-x/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import-x/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import-x/ignore': ['node_modules'],
  },
  rules: {
    'import-x/no-cycle': ['warn', { ignoreExternal: true }],
    'no-restricted-imports': ['error', {patterns:[{group:['**/apps/web/**'],message:'Packages must not depend on applications.'}]}],
  },
  overrides: [
    {
      files: ['tests/e2e/**/*.ts'],
      // CRA enables RTL/Jest heuristics for all tests; Playwright uses page
      // locators and expect(actual, message), which those rules misidentify.
      rules: {
        'testing-library/prefer-screen-queries': 'off',
        'jest/valid-expect': 'off',
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        // Warnings only. No type-aware project service or property renames.
        // Imported bindings are not selected; destructured/API names are exempt.
        '@typescript-eslint/naming-convention': [
          'warn',
          { selector: 'typeLike', format: ['PascalCase'] },
          {
            selector: 'interface',
            format: ['PascalCase'],
            custom: { regex: '^I[A-Z]', match: false },
          },
          {
            selector: 'variable',
            format: ['camelCase', 'PascalCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'variable',
            modifiers: ['const'],
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'variable',
            modifiers: ['const', 'destructured'],
            format: null,
          },
          { selector: 'variable', modifiers: ['destructured'], format: null },
          {
            selector: 'function',
            format: ['camelCase', 'PascalCase'],
            leadingUnderscore: 'allow',
          },
          {
            selector: 'parameter',
            format: ['camelCase', 'PascalCase'],
            leadingUnderscore: 'allow',
          },
          { selector: 'parameter', modifiers: ['destructured'], format: null },
        ],
      },
    },
  ],
}
