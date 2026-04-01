// @ts-check
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import { baseConfig } from './base.mjs';

/**
 * @param {{ tsconfigRootDir: string }} options
 * @returns {import('eslint').Linter.Config[]}
 */
export function nestjsConfig({ tsconfigRootDir }) {
  return defineConfig(
    ...baseConfig({ tsconfigRootDir }),
    {
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        sourceType: 'commonjs',
      },
    },
    {
      rules: {
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
      },
    },
  );
}
