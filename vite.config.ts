import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url'

import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'unplugin-dts/vite';

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      name: 'deducible',
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es', 'cjs'],
    },
    rolldownOptions: {
      external: ['parjs', 'parjs/combinators', 'assert'],
    },
  },
  plugins: [tsconfigPaths(), dts({ include: './src/*' })],
  test: {
    include: ['test/**/*.test.[jt]s'],
    setupFiles: [
      require.resolve('set.prototype.union/auto'),
      require.resolve('set.prototype.difference/auto'),
    ]
  },
});
