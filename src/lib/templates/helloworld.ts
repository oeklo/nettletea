import type { Template } from '$lib';

interface Data {
	name: string;
}

export default {
	name: 'hello-world',
	fn: ({ name }) => {
		return {
			'blocks': [
				{
					'text': {
						'type': 'mrkdwn',
						'text': `hello ${name}`
					},
					'type': 'section'
				}
			]
		};
	},
	examples: {
		default: {
			name: 'World'
		}
	}
} as Template<Data>;
