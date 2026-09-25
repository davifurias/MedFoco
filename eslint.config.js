import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['legacy/**', '**/node_modules/**', '**/dist/**', '**/coverage/**'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // O app não pode depender de APIs internas de plataformas (ver AGENTS.md).
      'no-restricted-properties': [
        'error',
        {
          object: 'window',
          property: 'claude',
          message:
            'Proibido: API interna do Claude. O MedFoco deve ser independente de plataforma.',
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended, reactHooks.configs.flat.recommended],
  },
);
