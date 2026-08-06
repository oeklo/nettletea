import {defineConfig} from 'tsdown';

export default defineConfig({
    clean: true,
    dts: true,
    entry: ['src/index.ts', 'src/cli.ts'],
    fixedExtension: false,
    format: ['esm'],
    minify: process.env.NODE_ENV === 'production',
    platform: 'node',
    sourcemap: true,
    target: 'es2024',
});
