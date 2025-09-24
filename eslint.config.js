import js from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default [
  // Global ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '*.min.js',
      'apps/frontend/.next/**',
      'apps/backend/dist/**',
      '**/next-env.d.ts', // Next.js auto-generated file
      '**/*.d.ts', // Type definition files
    ],
  },

  // Base configuration for all JavaScript files
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // ESLint recommended rules
      ...js.configs.recommended.rules,

      // Code Quality Rules
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': 'off', // Console is okay for development
      'no-debugger': 'warn',
      'no-alert': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',

      // Error Prevention
      eqeqeq: ['error', 'always'],
      'no-implicit-coercion': 'error',
      'no-unneeded-ternary': 'error',
      'no-nested-ternary': 'warn',
      'no-duplicate-imports': 'error',

      // Best Practices
      'consistent-return': 'error',
      'default-case': 'error',
      'dot-notation': 'error',
      'no-else-return': 'error',
      'no-empty-function': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-lone-blocks': 'error',
      'no-multi-spaces': 'error',
      'no-new': 'error',
      'no-return-assign': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'no-unused-expressions': 'error',
      'no-useless-call': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-promise-reject-errors': 'error',
      'require-await': 'error',
    },
  },

  // Frontend specific configuration
  {
    files: ['apps/frontend/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      'no-console': 'warn', // More strict for frontend
    },
  },

  // TypeScript specific configuration
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),

  // Backend specific configuration
  {
    files: ['apps/backend/**/*.{js,mjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      'no-console': 'off', // Console is fine for backend logging
      'no-process-env': 'off',
    },
  },

  // Prettier integration - disable conflicting rules
  prettierConfig,

  // Test files configuration
  {
    files: [
      '**/*.test.{js,mjs}',
      '**/*.spec.{js,mjs}',
      '**/tests/**/*.{js,mjs}',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.mocha,
      },
    },
    rules: {
      'no-unused-expressions': 'off',
    },
  },
];
