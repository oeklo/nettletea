import type { Template } from '../index.ts';
import { Type } from '@fastify/type-provider-typebox';

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
	},
	schema: Type.Object({
		name: Type.String()
	})
} as Template<Data>;
