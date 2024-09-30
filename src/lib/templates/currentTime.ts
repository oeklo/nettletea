import type { Template } from '../index.ts';

interface Data {
	currentTime: Date;
}

export default {
	name: 'Current Time',
	fn: ({ currentTime }: Data) => `Now is ${currentTime}!`,
	examples: {
		default: {
			currentTime: new Date()
		},
		newYear: {
			currentTime: new Date(2024, 1, 1)
		}
	}
} as Template<Data>;
