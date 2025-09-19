module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
    browser: true,
    jest: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  ignorePatterns: ['dist', 'node_modules', 'frontend/dist', 'backend/dist'],
  overrides: [
    {
      files: ['frontend/src/**/*.{ts,tsx}'],
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      rules: {}
    }
  ],
  rules: {
    'no-console': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
};
