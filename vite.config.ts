import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url'

import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'unplugin-dts/vite';

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: [resolve(__dirname, 'src/index.ts')],
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {
      external: ['parjs-then', 'parjs-then/combinators', 'assert'],
    },
  },
  plugins: [tsconfigPaths(), dts({ bundleTypes: true, tsconfigPath: './src/tsconfig.json', include: ['./src/**/*.ts'] })],
  test: {
    include: ['test/**/*.test.[jt]s'],
    setupFiles: [
      require.resolve('set.prototype.union/auto'),
      require.resolve('set.prototype.difference/auto'),
    ],
  },
});
