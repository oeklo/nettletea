/** @type {import('tailwindcss').Config} */
import { skeleton } from '@skeletonlabs/tw-plugin';
import { join } from 'path';
import { myCustomTheme } from './theme'
export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')
	],

	plugins: [
		skeleton({
			themes: {
				custom: [
					myCustomTheme
				]
			}
		})
	],
};

