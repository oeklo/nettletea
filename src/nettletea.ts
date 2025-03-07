import path from 'node:path';
import { Type } from '@fastify/type-provider-typebox';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/swagger';
import slack, {
	type ChatPostMessageArguments,
	WebClient,
	type WebClientOptions,
} from '@slack/web-api';
import i18next, { type TFunction } from 'i18next';

import {
	NotFound,
	getUserId,
	resolveChannelIds,
	resolveUserIds,
} from './slack';
import type { Message, Template } from './types';

interface PayloadBody {
	payload: unknown;
}

interface PreviewParams {
	mode: 'header' | 'body';
}

interface SendBody extends PayloadBody {
	to_users?: string[];
	to_channels?: string[];
}

interface ResolveTargetArgs {
	overrideTo?: string;
	to_users?: string[];
	to_channels?: string[];
	slackClient: WebClient;
}

async function renderTemplate<Data>(
	template: Template<Data>,
	data: Data | undefined,
	t: TFunction,
	slack: WebClient,
) {
	const rendered_ = template.fn(data ?? ({} as unknown as Data), t, slack);
	return rendered_ instanceof Promise ? await rendered_ : rendered_;
}

async function resolveTargets({
	overrideTo,
	to_users,
	to_channels,
	slackClient,
}: ResolveTargetArgs): Promise<string[]> {
	if (overrideTo) {
		return [await getUserId(overrideTo, slackClient)];
	}
	const users = await resolveUserIds(to_users ?? [], slackClient);
	const channels = await resolveChannelIds(to_channels ?? [], slackClient);
	return [...users, ...channels];
}

function mkSendHandler(
	template: Template<any>,
	t: TFunction,
	slackClient: WebClient,
	overrideTo?: string,
) {
	return async (
		request: FastifyRequest<{ Body: SendBody }>,
		reply: FastifyReply,
	) => {
		console.log(JSON.stringify(request.body, null, 2));
		try {
			const rendered = await renderTemplate(
				template,
				request.body.payload,
				t,
				slackClient,
			);
			const targets = await resolveTargets({
				overrideTo,
				slackClient,
				...request.body,
			});

			for (const channel of targets)
				await slackClient.chat.postMessage({
					channel,
					...rendered,
				} as ChatPostMessageArguments);
			reply.code(204).send();
		} catch (error) {
			console.error({ type: typeof error, error });

			if (error instanceof NotFound)
				reply.code(404).send({ error: error.message });
			else if (error instanceof Error)
				reply.code(500).send({ error: error.message });
			return;
		}
	};
}

function mkViewHandler(
	template: Template<any>,
	t: TFunction,
	slackClient: WebClient,
) {
	return async (
		request: FastifyRequest<{ Body: PayloadBody; Querystring: PreviewParams }>,
		reply: FastifyReply,
	) => {
		let rendered: Message;
		try {
			rendered = await renderTemplate(
				template,
				request.body.payload,
				t,
				slackClient,
			);
		} catch (error) {
			console.error({ type: typeof error, error });

			if (error instanceof NotFound)
				reply.code(404).send({ error: error.message });
			else if (error instanceof Error)
				reply.code(500).send({ error: error.message });
			return;
		}
		rendered.text = undefined;
		const location = `https://app.slack.com/block-kit-builder/T4LJR706L#${JSON.stringify(rendered)}`;
		// can't use location header dues to CORS
		reply.code(303);
		console.log({ mode: request.query });
		if (request.query.mode !== 'body')
			reply.header('Location', encodeURI(location)).send();
		else reply.header('content-type', 'text/plain').send(location);
	};
}

interface NettleTeaArgs {
	server: FastifyInstance;
	root?: string;
	templates: { [templateName: string]: Template<any> };
	slackToken: string;
	slackOptions?: WebClientOptions;
	overrideTo?: string;
	lang?: string;
}

export async function nettleTea(opts: NettleTeaArgs) {
	const slackClient = new WebClient(
		opts.slackToken,
		opts.slackOptions ?? {
			retryConfig: slack.retryPolicies.tenRetriesInAboutThirtyMinutes,
		},
	);

	const root_ = path.join(opts.root ?? '/', '/t');

	const i18n = i18next.createInstance();
	await i18n.init({
		lng: opts.lang ?? 'en',
	});

	for (const [name, template] of Object.entries(opts.templates)) {
		const schemaId = template.schema.$id ?? `${name}Input`;
		opts.server.addSchema({
			$id: schemaId,
			examples: Object.values(template.examples),
			...template.schema,
		});

		Object.entries(template.translations).map(([lang, translations]) =>
			i18n.addResourceBundle(lang, name, translations),
		);

		const t = i18n.getFixedT(null, name);

		opts.server.route({
			method: 'POST',
			url: path.join(root_, name),
			handler: async (
				request: FastifyRequest<{
					Body: PayloadBody;
				}>,
				reply: FastifyReply,
			) => {
				try {
					const rendered = template.fn(
						request.body.payload ?? {},
						t,
						slackClient,
					);
					return rendered instanceof Promise ? await rendered : rendered;
				} catch (error) {
					console.error({ type: typeof error, error });

					if (error instanceof NotFound)
						reply.code(404).send({ error: error.message });
					else if (error instanceof Error)
						reply.code(500).send({ error: error.message });
					return;
				}
			},
			schema: {
				operationId: name,
				body: Type.Object({
					payload: Type.Ref(schemaId),
				}),
			},
		});

		const url = path.join(root_, `${name}/send`);
		const handler = mkSendHandler(template, t, slackClient, opts.overrideTo);
		opts.server.route({
			method: 'POST',
			url,
			handler,

			schema: {
				operationId: `${name}Send`,
				body: {
					type: 'object',
					content: {
						'application/json': {
							schema: Type.Object(
								{
									payload: Type.Ref(schemaId),
									to_users: Type.Optional(
										Type.Array(Type.String({ format: 'email' })),
									),
									to_channels: Type.Optional(Type.Array(Type.String())),
								},
								{
									minProperties: 2,
									additionalProperties: false,
								},
							),
							examples: template.examples,
						},
					},
				},
				response: {
					'204': {
						description: 'Successful response',
						type: 'null',
					},
				},
			},
		});

		opts.server.route({
			method: 'POST',
			url: path.join(root_, `${name}/preview`),
			handler: mkViewHandler(template, t, slackClient),

			schema: {
				querystring: {
					type: 'object',
					properties: {
						mode: {
							type: 'string',
							enum: ['body', 'header'],
							default: 'body',
						},
					},
				},
				operationId: `${name}Preview`,
				body: {
					type: 'object',
					content: {
						'application/json': {
							schema: Type.Object(
								{
									payload: Type.Ref(schemaId),
								},
								{
									additionalProperties: false,
								},
							),
							examples: template.examples,
						},
					},
				},
				response: {
					'303': {
						description: 'Successful response',
						type: 'string',
					},
				},
			},
		});
	}
}
