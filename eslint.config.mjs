import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/packages/parser/**'],
    rules: {
      // CommonMark reference parser regexes intentionally match control characters
      // and use escapes that ESLint flags but are kept for spec fidelity.
      'no-control-regex': 'off',
      'no-useless-escape': 'off',
    },
  }
);
