import {ErrorCode, type UsersLookupByEmailResponse, type WebAPIPlatformError, type WebClient} from '@slack/web-api';
import type {Resolvers} from './types.js';

function isPlatformError(error: unknown): error is WebAPIPlatformError {
    return error instanceof Error && 'code' in error && error.code === ErrorCode.PlatformError;
}

const channelCache: {[name: string]: string} = {};

export class NotFound extends Error {
    type: string;
    value: string;

    constructor(value: string, type: string) {
        super(`${type} ${value} not found`);
        this.name = 'NotFound';
        this.type = type;
        this.value = value;
    }
}

export class SlackNotConfigured extends Error {
    constructor() {
        super('Slack sending is disabled: no Slack token configured');
        this.name = 'SlackNotConfigured';
    }
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

    for (const name of channelNames) {
        if (channelCache[name]) {
            resolvedChannels.set(name, channelCache[name]);
        } else {
            namesToFetch.push(name);
        }
    }

    let cursor: string | undefined;
    while (namesToFetch.length > 0) {
        const response = await slack.conversations.list({
            cursor: cursor,
            exclude_archived: true,
            limit: MAX_CHANNELS_LIST,
            types: 'public_channel,private_channel',
        });

        if (response.channels) {
            for (const channel of response.channels) {
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
            }
        }

        if (response.response_metadata?.next_cursor) {
            cursor = response.response_metadata.next_cursor;
        } else {
            break;
        }
    }

    return channelNames.map(name => {
        const id = resolvedChannels.get(name);
        if (!id) throw new NotFound(name, 'channel');
        return id;
    });
};

const userCache: {[email: string]: string} = {};

export async function getUserId(email: string, slack: WebClient): Promise<string> {
    if (email in userCache) return userCache[email];

    let user: UsersLookupByEmailResponse;
    try {
        user = await slack.users.lookupByEmail({email});
    } catch (error) {
        if (isPlatformError(error) && error.data.error === 'users_not_found') throw new NotFound(email, 'user');
        throw error;
    }
    if (!user.ok) throw new NotFound(email, 'user');

    const userId = user.user!.id!;
    userCache[email] = userId;
    return userId;
}

export async function resolveUserIds(emails: string[], slack: WebClient): Promise<string[]> {
    return Promise.all(emails.map(async email => await getUserId(email, slack)));
}

export function createResolvers(slack?: WebClient): Resolvers {
    if (slack === undefined) {
        const notConfigured = (): never => {
            throw new SlackNotConfigured();
        };
        return {resolveChannelIds: notConfigured, resolveUserIds: notConfigured};
    }
    return {
        resolveChannelIds: channelNames => resolveChannelIds(channelNames, slack),
        resolveUserIds: emails => resolveUserIds(emails, slack),
    };
}
