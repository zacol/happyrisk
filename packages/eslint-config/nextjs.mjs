// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { baseConfig } from './base.mjs';

/**
 * @param {{ tsconfigRootDir: string }} options
 * @returns {import('eslint').Linter.Config[]}
 */
export function nextjsConfig({ tsconfigRootDir }) {
  return defineConfig(
    ...baseConfig({ tsconfigRootDir }),
    ...nextVitals,
    ...nextTs,
    globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'postcss.config.mjs']),
  );
}
