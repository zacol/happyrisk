// @ts-check
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

/**
 * @param {{ rootDir: string }} options
 * @returns {import('eslint').Linter.Config[]}
 */
export function nextjsConfig({ rootDir }) {
  void rootDir;
  return defineConfig([
    ...nextVitals,
    ...nextTs,
    globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  ]);
}
