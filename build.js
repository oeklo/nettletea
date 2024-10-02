import esbuild from 'esbuild';
import pkg from './package.json' with { type: 'json' };

esbuild
	.build({
		bundle: true,
		entryPoints: ['src/index.ts'],
		external: [...Object.keys(pkg.peerDependencies || {}),
			'@slack/web-api',
		],
		format: 'esm',
		minify: process.env.NODE_ENV === 'production',
		outfile: 'dist/index.js',
		platform: 'node',
		sourcemap: true,
		target: ['es2022'],
	})
	.catch(() => process.exit(1));
