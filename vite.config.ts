import { defineConfig } from 'vite';
// Relative base so the build works from any static host or sub-path.
import pkg from './package.json' with { type: 'json' };
export default defineConfig({ base: './', define: { __APP_VERSION__: JSON.stringify(pkg.version) }, build: { target: 'es2020', chunkSizeWarningLimit: 900 } });
