import type { Template } from '$lib';

interface Data {
	currentTime: Date;
}

export default {
	name: 'current-time',
	fn: ({ currentTime }) => `Now is ${currentTime}!`,
	examples: {
		default: {
			currentTime: new Date()
		},
		newYear:{
			currentTime: new Date(2024,1,1),
		}
	}
} as Template<Data>;
