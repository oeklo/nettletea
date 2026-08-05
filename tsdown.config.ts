import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm'],
	platform: 'node',
	target: 'es2024',
	fixedExtension: false,
	sourcemap: true,
	dts: true,
	clean: true,
	minify: process.env.NODE_ENV === 'production',
});
