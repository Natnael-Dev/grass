import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-test/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      '.playwright-mcp/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['info', 'warn', 'error', 'debug'] }],
    },
  },
  {
    files: ['scripts/**/*.{js,mjs,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['src/world/**/*.{ts,js}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/ui/*', '../ui/*', '../../ui/*'],
              message: 'World layer cannot import from UI layer (architecture rule).',
            },
            {
              group: ['**/app/App*', '../app/App*'],
              message: 'Nothing can import App except main.ts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,js}'],
    ignores: ['src/main.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/app/App', '**/App'],
              message: 'Nothing can import App except main.ts.',
            },
          ],
        },
      ],
    },
  },
);
