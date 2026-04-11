// @ts-check
import stylistic from '@stylistic/eslint-plugin';
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
        '@stylistic': stylistic,
        'simple-import-sort': simpleImportSort,
      },
      rules: {
        'no-duplicate-imports': 'error',
        'no-param-reassign': ['error', { props: false }],
        '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
        '@stylistic/comma-dangle': [
          'error',
          {
            arrays: 'always-multiline',
            objects: 'always-multiline',
            imports: 'always-multiline',
            exports: 'always-multiline',
            enums: 'always-multiline',
            generics: 'always-multiline',
            functions: 'always-multiline',
          },
        ],
        '@stylistic/padding-line-between-statements': [
          'error',
          {
            blankLine: 'always',
            prev: '*',
            next: [
              'return',
              'class',
              'export',
              'switch',
              'throw',
              'try',
              'while',
              'for',
              'block',
              'if',
            ],
          },
          { blankLine: 'always', prev: ['const', 'let', 'var', 'case', 'default'], next: '*' },
          { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
          { blankLine: 'any', prev: ['export'], next: ['export'] },
        ],
        '@stylistic/semi': ['error', 'always'],
        '@stylistic/semi-style': ['error', 'last'],
        '@stylistic/member-delimiter-style': 'error',
        '@stylistic/object-curly-spacing': ['error', 'always'],
        '@stylistic/type-annotation-spacing': ['error'],
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
