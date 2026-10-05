import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';

export default defineConfig([
  ...nextVitals,
  {
    files: ['src/app/(main)/**/*.tsx', 'src/components/Offline/**/*.tsx'],
    // Core navigation intentionally requests the precached HTML shell rather than online RSC.
    rules: { '@next/next/no-html-link-for-pages': 'off' },
  },
  globalIgnores(['.next/**', 'public/sw*.js']),
]);
