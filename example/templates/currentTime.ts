import { Type } from '@fastify/type-provider-typebox';
import type { Template } from '../../src/types.js';

export interface Data {
	currentTime: string;
}

export default {
	examples: {
		default: {
			currentTime: new Date().toISOString(),
		},
		newYear: {
			currentTime: new Date(2024, 1, 1).toISOString(),
		},
	},
	fn: ({ currentTime }: Data) => {
		const text = `Now is ${new Date(Date.parse(currentTime)).toLocaleString('de')}!`;
		return {
			blocks: [
				{
					text: {
						text: text,
						type: 'mrkdwn',
					},
					type: 'section',
				},
			],
			text,
		};
	},
	name: 'Current Time',
	schema: Type.Object({
		currentTime: Type.String({ format: 'date-time' }),
	}),
} as Template<Data>;
