import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    dts({
      insertTypesEntry: true, // Inserts `import './types/index.d.ts'` into the UMD/ESM bundles
      outDir: 'dist', // Output directory for .d.ts files
      // By default, it should pick up tsconfig.json settings for declaration generation.
      // We might need to specify tsConfigFilePath if it's not found.
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'geotic',
      formats: ['es', 'umd'],
      fileName: (format) => `geotic.${format}.js`,
    },
    rollupOptions: {
      // Ensure to externalize deps that shouldn't be bundled
      // into your library (e.g., if your library is a plugin for another framework)
      // external: ['vue'], // Example
      // output: {
      //   globals: { // Example if providing UMD build and it expects globals
      //     vue: 'Vue',
      //   },
      // },
    },
  },
});
