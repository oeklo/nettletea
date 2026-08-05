import path from 'node:path';
import { Type } from '@fastify/type-provider-typebox';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/swagger';
import slack, { type ChatPostMessageArguments, WebClient, type WebClientOptions } from '@slack/web-api';
import i18next, { type TFunction } from 'i18next';

import { getUserId, NotFound, resolveChannelIds, resolveUserIds } from './slack';
import type { Message, Template } from './types';

interface PayloadBody {
	payload: unknown;
}

interface PreviewParams {
	mode: 'header' | 'body';
}

type SendTarget = { user: string } | { channel: string };

interface SendBody extends PayloadBody {
	to?: SendTarget[];
	to_users?: string[];
	to_channels?: string[];
}

interface ResolveTargetArgs {
	overrideTo?: string;
	to_users: string[];
	to_channels: string[];
	slackClient: WebClient;
}

async function renderTemplate<Data>(template: Template<Data>, data: Data | undefined, t: TFunction, slack: WebClient) {
	const rendered_ = template.fn(data ?? ({} as unknown as Data), t, slack);
	return rendered_ instanceof Promise ? await rendered_ : rendered_;
}

function sendErrorReply(reply: FastifyReply, error: unknown) {
	reply.log.error({ error }, 'template handler failed');
	if (error instanceof NotFound) reply.code(404).send({ error: error.message });
	else if (error instanceof Error) reply.code(500).send({ error: error.message });
}

function normalizeTargets(body: SendBody): { to_users: string[]; to_channels: string[] } {
	const to_users = [...(body.to_users ?? [])];
	const to_channels = [...(body.to_channels ?? [])];
	for (const target of body.to ?? []) {
		if ('user' in target) to_users.push(target.user);
		else to_channels.push(target.channel);
	}
	return { to_users, to_channels };
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
	const users = await resolveUserIds(to_users, slackClient);
	const channels = await resolveChannelIds(to_channels, slackClient);
	return [...users, ...channels];
}

function mkSendHandler(template: Template<any>, t: TFunction, slackClient: WebClient, overrideTo?: string) {
	return async (request: FastifyRequest<{ Body: SendBody }>, reply: FastifyReply) => {
		try {
			const rendered = await renderTemplate(template, request.body.payload, t, slackClient);
			if (request.body.to_users || request.body.to_channels) {
				reply.log.warn('to_users/to_channels are deprecated; use `to` instead');
			}
			const targets = await resolveTargets({
				overrideTo,
				slackClient,
				...normalizeTargets(request.body),
			});

			for (const channel of targets)
				await slackClient.chat.postMessage({
					channel,
					...rendered,
				} as ChatPostMessageArguments);
			reply.code(204).send();
		} catch (error) {
			sendErrorReply(reply, error);
			return;
		}
	};
}

function mkViewHandler(template: Template<any>, t: TFunction, slackClient: WebClient) {
	return async (request: FastifyRequest<{ Body: PayloadBody; Querystring: PreviewParams }>, reply: FastifyReply) => {
		let rendered: Message;
		try {
			rendered = await renderTemplate(template, request.body.payload, t, slackClient);
		} catch (error) {
			sendErrorReply(reply, error);
			return;
		}
		rendered.text = undefined;
		const location = `https://app.slack.com/block-kit-builder/T4LJR706L#${encodeURIComponent(JSON.stringify(rendered))}`;
		// can't use location header dues to CORS
		reply.code(303);
		if (request.query.mode !== 'body') reply.header('Location', location).send();
		else reply.header('content-type', 'text/plain').send(location);
	};
}

interface NettleTeaArgs {
	lang?: string;
	overrideTo?: string;
	root?: string;
	server: FastifyInstance;
	slackOptions?: WebClientOptions;
	slackToken: string;
	templates: { [templateName: string]: Template<any> };
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

		Object.entries(template.translations ?? {}).map(([lang, translations]) =>
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
					return await renderTemplate(template, request.body.payload as any, t, slackClient);
				} catch (error) {
					sendErrorReply(reply, error);
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
							schema: Type.Union([
								Type.Object(
									{
										payload: Type.Ref(schemaId),
										to: Type.Array(
											Type.Union([
												Type.Object({ user: Type.String({ format: 'email' }) }),
												Type.Object({ channel: Type.String() }),
											]),
											{ minItems: 1 },
										),
									},
									{
										additionalProperties: false,
									},
								),
								Type.Object(
									{
										payload: Type.Ref(schemaId),
										to_users: Type.Optional(Type.Array(Type.String({ format: 'email' }))),
										to_channels: Type.Optional(Type.Array(Type.String())),
									},
									{
										minProperties: 2,
										additionalProperties: false,
									},
								),
							]),
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
