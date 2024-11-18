import type { TSchema } from '@fastify/type-provider-typebox';
import type { Block, KnownBlock } from '@slack/types';
import type { WebClient } from '@slack/web-api';
import type { TFunction } from 'i18next';

export interface Message {
	text: string;
	blocks: (KnownBlock | Block)[];
}

export interface Template<Data> {
	examples: { [name: string]: Data };
	fn: (data: Data, t: TFunction, slack: WebClient) => Message | Promise<Message>;
	name: string;
	schema: TSchema;
	translations: { [lang: string]: { [key: string]: any } };
}

export type Templates<Data> = { [templateName: string]: Template<Data> };
