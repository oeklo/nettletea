import type { WebClient } from '@slack/web-api';

const channelCache: { [name: string]: string } = {};

export class NotFound extends Error {
}

const MAX_CHANNELS_LIST = 1000;

/**
 * Resolves channel IDs for a list of channel names.
 * Utilizes an in-memory cache to minimize API calls.
 *
 * @param channelNames - Array of Slack channel names to resolve
 * @param slack - slack client
 * @returns A Map where keys are channel names and values are channel IDs
 */
export const resolveChannelIds = async (channelNames: string[], slack: WebClient): Promise<string[]> => {
	const resolvedChannels = new Map<string, string>();

	const namesToFetch: string[] = [];

	channelNames.forEach((name) => {
		if (channelCache[name]) {
			resolvedChannels.set(name, channelCache[name]);
		} else {
			namesToFetch.push(name);
		}
	});

	let cursor: string | undefined = undefined;
	while (namesToFetch.length > 0) {
		const response = await slack.conversations.list({
			exclude_archived: true,
			limit: MAX_CHANNELS_LIST,
			types: 'public_channel,private_channel',
			cursor: cursor
		});

		if (response.channels) {
			response.channels.forEach((channel) => {
				if (channel.name && channel.id) {
					channelCache[channel.name] = channel.id;

					// If the channel is one of the names we're looking for, add to resolved
					if (namesToFetch.includes(channel.name)) {
						resolvedChannels.set(channel.name, channel.id);

						// Remove the found name from namesToFetch
						const index = namesToFetch.indexOf(channel.name);
						if (index > -1) {
							namesToFetch.splice(index, 1);
						}
					}
				}
			});
		}

		if (response.response_metadata && response.response_metadata.next_cursor) {
			cursor = response.response_metadata.next_cursor;
		} else {
			break;
		}
	}

	// At this point, some channel names might not have been found
	// You can choose to handle them as needed (e.g., throw an error or skip)
	channelNames.forEach((name) => {
		if (!resolvedChannels.has(name)) {
			throw new NotFound(name);
		}
	});

	return [...resolvedChannels.values()];
};


const userCache: { [email: string]: string } = {};

async function getUserId(email: string, slack: WebClient): Promise<string> {
	if (Object.keys(userCache).includes(email))
		return userCache[email];
	else {
		const user = await slack.users.lookupByEmail({ email });
		if (!user.ok)
			throw new NotFound(email);

		const userId = user.user!.id!;
		userCache[email] = userId;
		return userId;
	}
}

export async function resolveUserIds(emails: string[], slack: WebClient): Promise<string[]> {
	return Promise.all(emails.map(async email => await getUserId(email, slack)));
}
