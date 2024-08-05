import type { Template } from '$lib';

interface Data {
	name: string;
}

export default {
	name: 'hello-world',
	fn: ({ name }) => `Hello ${name}!`,
	examples: {
		default: {
			name: 'World'
		}
	}
} as Template<Data>;
