// @ts-check
import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';

/**
 * @param {{ tsconfigRootDir: string }} options
 * @returns {import('eslint').Linter.Config[]}
 */
export function baseConfig({ tsconfigRootDir }) {
  return defineConfig(
    {
      ignores: ['eslint.config.mjs', 'dist/**'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
    },
    {
      plugins: {
        'simple-import-sort': simpleImportSort,
      },
      rules: {
        'simple-import-sort/imports': [
          'error',
          {
            groups: [
              ['^\\u0000'],
              ['^node:'],
              ['^@happyrisk/'],
              ['^@?\\w'],
              ['^@/'],
              ['^\\.'],
              ['\\.css$'],
            ],
          },
        ],
        'simple-import-sort/exports': 'error',
        'no-restricted-imports': [
          'error',
          {
            patterns: [{ regex: '^\\.\\.' }],
          },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        'prettier/prettier': ['error', { endOfLine: 'auto' }],
      },
    },
  );
}
