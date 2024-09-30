import type { Template } from '../index.ts';

interface Data {
	name: string;
}

export default {
	name: 'Hello World',
	fn: ({ name }: Data) => {
		return {
			'blocks': [
				{
					'text': {
						'type': 'mrkdwn',
						'text': `hello ${name}`
					},
					'type': 'section'
				}
			],
			text: `hello ${name}`,
		};
	},
	examples: {
		default: {
			name: 'World'
		}
	}
} as Template<Data>;
