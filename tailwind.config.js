/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
	daisyui: {
		themes: [
			{
				nettletea: {
					'primary': '#60b579',
					'secondary': '#cab642',
					'accent': '#94c356',
					'neutral': '#b97340',
					'base-100': '#ffffff',
					'info': '#94c356',
					'success': '#00b565',
					'warning': '#cab642',
					'error': '#b97340'
				}
			}
		]
	},
	content: [
		'./src/**/*.{html,js,svelte,ts}'
	],

	plugins: [daisyui]
};

