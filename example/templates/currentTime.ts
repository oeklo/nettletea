import { Type } from '@fastify/type-provider-typebox';
import type { Template } from 'nettletea';

export interface Data {
	currentTime: string;
}

export default {
	name: 'Current Time',
	fn: ({ currentTime }: Data) => {
		const text = `Now is ${new Date(Date.parse(currentTime)).toLocaleString('de')}!`;
		console.log(text);
		return {
			blocks: [
				{
					text: {
						type: 'mrkdwn',
						text: text,
					},
					type: 'section',
				},
			],
			text,
		};
	},

	examples: {
		default: {
			currentTime: new Date().toISOString(),
		},
		newYear: {
			currentTime: new Date(2024, 1, 1).toISOString(),
		},
	},
	schema: Type.Object({
		currentTime: Type.String({ format: 'date-time' }),
	}),
} as Template<Data>;
