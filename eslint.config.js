// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    rules: {
      // General JavaScript/TypeScript rules
      'no-template-curly-in-string': 'error',
      'no-alert': 'off',
      'no-undef-init': 'off',
      'no-async-promise-executor': 'off',
      'no-irregular-whitespace': 'warn',
      'eqeqeq': 'warn',
      'max-statements-per-line': ['error', { max: 2 }],

      // ESLint comments
      'eslint-comments/no-unlimited-disable': 'off',

      // Import rules
      'unused-imports/no-unused-vars': 'warn',

      // TypeScript specific rules
      'ts/consistent-type-definitions': 'off',
      'ts/strict-boolean-expressions': 'off',
      'ts/no-unsafe-assignment': 'off',
      'ts/no-throw-literal': 'off',
      'ts/no-unsafe-argument': 'off',
      'ts/no-unsafe-call': 'off',
      'ts/no-unsafe-return': 'off',
      'ts/no-unsafe-member-access': 'off',
      'ts/no-misused-promises': 'off',
      'ts/explicit-function-return-type': 'off',
      'ts/no-explicit-any': 'warn',
      'ts/no-non-null-assertion': 'off',

      // Style rules
      'style/max-statements-per-line': ['error', { max: 2 }],
      'style/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      'style/arrow-parens': ['error', 'always'],

      // Regexp rules
      'regexp/no-super-linear-backtracking': 'off',
      'regexp/no-unused-capturing-group': 'off',

      // Unicorn rules
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-array-reduce': 'off',

      // Antfu specific
      'antfu/no-top-level-await': 'off',
      'antfu/if-newline': 'error',
    },
  },
  {
    ignores: [
      'node_modules',
      'dist/',
      'coverage/',
      '.ai-guidelines/',
      'example/',
      '**/*.md',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'ts/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
)