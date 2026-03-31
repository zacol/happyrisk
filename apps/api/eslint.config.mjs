// @ts-check
import { nestjsConfig } from '@happyrisk/eslint-config/nestjs';

export default [
  { ignores: ['src/generated/**'] },
  ...nestjsConfig({ tsconfigRootDir: import.meta.dirname }),
];
