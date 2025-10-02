// Import necessary modules for configuration
import globals from 'globals';
import js from '@eslint/js'; // The official recommended ruleset

const INDENT = 2;

export default [
  // Apply the recommended ruleset
  js.configs.recommended,

  // Global configuration object
  {
    // Apply this configuration to all relevant files
    files: ['**/*.js'],

    // Define language options
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node, // Use predefined globals for Node.js environment
      },
    },

    // Define custom rules and overrides
    rules: {
      // Error prevention / Possible errors
      'no-console': 'error',
      'no-var': 'error',
      'eqeqeq': 'error',
      'no-implicit-globals': 'error',
      'no-implicit-coercion': 'error',
      'no-empty-function': ['error', { 'allow': ['constructors'] }],
      'no-throw-literal': 'error',
      'no-unsafe-finally': 'error',

      // Async / Promises
      'require-await': 'error',
      'no-return-await': 'warn',
      'no-promise-executor-return': 'error',
      'require-atomic-updates': 'error',

      // Code style / Formatting
      'semi': ['error', 'always'],
      'curly': 'error',
      'brace-style': ['error', 'stroustrup'],
      'indent': ['error', INDENT, { 'SwitchCase': 1 }],
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'always-multiline'],
      'comma-spacing': ['error', { 'before': false, 'after': true }],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'keyword-spacing': ['error', { 'before': true, 'after': true }],
      'space-before-blocks': 'error',
      'no-multi-spaces': 'error',

      // Best Practices / Logic
      'consistent-return': 'error',
      'no-param-reassign': 'warn',
      'prefer-template': 'error',
      'no-magic-numbers': ['warn', { 'ignore': [0, 1, -1] }],

    },
  },

  // Global ignores configuration
  {
    ignores: [
      'node_modules/',
      '*.log',
    ],
  },
];