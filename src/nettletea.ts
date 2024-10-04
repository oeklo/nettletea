import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from '@fastify/type-provider-typebox';
import slack, { type ChatPostMessageArguments, WebClient, WebClientOptions } from '@slack/web-api';
import { type Template } from './types';
import { NotFound, resolveChannelIds, resolveUserIds } from './slack';

interface PayloadBody {
	payload: unknown;
}

interface SendBody extends PayloadBody {
	to_users?: string[];
	to_channels?: string[];
}

function mkSendHandler(template: Template<any>, slackClient: WebClient) {
	return async function (request: FastifyRequest<{ Body: SendBody }>, reply: FastifyReply) {
		const rendered_ = template.fn(request.body.payload ?? {}, slackClient);
		const rendered = rendered_ instanceof Promise ? await rendered_ : rendered_;

		let users;
		try {
			users = await resolveUserIds(request.body.to_users ?? [], slackClient);
		} catch (error) {
			console.error(error);
			reply.code(404).send({ error: 'user not found', object: (error as NotFound).name });
			return;
		}

		let channels;
		try {
			channels = await resolveChannelIds(request.body.to_channels ?? [], slackClient);
		} catch (error) {
			console.error(error);
			reply.code(404).send({ error: 'channel not found', object: (error as NotFound).name });
			return;
		}

		for (const channel of [...users, ...channels])
			await slackClient.chat.postMessage({
				channel,
				...rendered
			} as ChatPostMessageArguments);
	};
}

interface NettleTeaArgs {
	server: FastifyInstance;
	root?: string;
	templates: { [templateName: string]: Template<any> };
	slackToken: string;
	slackOptions: WebClientOptions;
}

export function nettleTea({ server, root, templates, slackToken, slackOptions }: NettleTeaArgs) {
	const slackClient = new WebClient(
		slackToken,
		slackOptions ?? {
			retryConfig: slack.retryPolicies.tenRetriesInAboutThirtyMinutes
		}
	);

	const root_ = path.join(root ?? '/', '/t');

	for (const [name, template] of Object.entries(templates)) {
		const schemaId = template.schema.$id ?? `${name}Input`;
		server.addSchema({
			$id: schemaId,
			examples: Object.values(template.examples),
			...template.schema
		});

		server.route({
			method: 'POST',
			url: path.join(root_, name),
			handler: async function (
				request: FastifyRequest<{
					Body: PayloadBody;
				}>
			) {
				return template.fn(request.body.payload ?? {}, slackClient);
			},
			schema: {
				body: Type.Object({
					payload: Type.Ref(schemaId)
				})
			}
		});

		server.route({
			method: 'POST',
			url: path.join(root_, `${name}/send`),
			handler: mkSendHandler(template, slackClient),

			schema: {
				body: {
					type: 'object',
					content: {
						'application/json': {
							schema: Type.Object(
								{
									payload: Type.Ref(schemaId),
									to_users: Type.Optional(Type.Array(Type.String({ format: 'email' }))),
									to_channels: Type.Optional(Type.Array(Type.String()))
								},
								{
									minProperties: 2,
									additionalProperties: false
								}
							),
							examples: template.examples
						}
					}
				}
			}
		});
	}
}
