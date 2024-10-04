import type { TSchema } from '@fastify/type-provider-typebox';
import type { Block, KnownBlock } from '@slack/types';
import type { WebClient } from '@slack/web-api';

export interface Message {
	text: string;
	blocks: (KnownBlock | Block)[];
}

export interface Template<Data> {
	examples: { [name: string]: Data };
	fn: (data: Data, slack: WebClient) => Message | Promise<Message>;
	name: string;
	schema: TSchema;
}

export type Templates<Data> = { [templateName: string]: Template<Data> };
