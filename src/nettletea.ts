import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type } from '@fastify/type-provider-typebox';
import { type ChatPostMessageArguments, WebClient } from '@slack/web-api';
import { type Template } from './lib/index.js';
import { NotFound, resolveChannelIds, resolveUserIds } from './lib/slack.js';
import { tenRetriesInAboutThirtyMinutes } from '@slack/web-api/dist/retry-policies.js';

const web = new WebClient(process.env.SLACK__TOKEN, {
	retryConfig: tenRetriesInAboutThirtyMinutes,
	agent
});

interface PayloadBody {
	payload: unknown;
}

interface SendBody extends PayloadBody {
	to_users?: string[];
	to_channels?: string[];
}

function mkSendHandler(template: Template<any>) {
	return async function(request: FastifyRequest<{ Body: SendBody }>, reply: FastifyReply) {
		const rendered = template.fn(request.body.payload ?? {});

		let users;
		try {
			users = await resolveUserIds(request.body.to_users ?? [], web);
		} catch (error) {
			reply.code(404).send({ error: 'user not found', object: (error as NotFound).name });
			return;
		}

		let channels;
		try {
			channels = await resolveChannelIds(request.body.to_channels ?? [], web);
		} catch (error) {
			reply.code(404).send({ error: 'user not found', object: (error as NotFound).name });
			return;

		}

		const allChannels = [
			...users,
			...channels
		];
		for (const channel of allChannels)
			await web.chat.postMessage({
				channel,
				...rendered
			} as ChatPostMessageArguments);
	};
}

interface NettleTeaArgs {
	server: FastifyInstance,
	root?: string
	templates: { [templateName: string]: Template<any> }
}

export function nettleTea({ server, root, templates }: NettleTeaArgs) {
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
			handler: async function(request: FastifyRequest<{
				Body: PayloadBody,
			}>) {
				return template.fn(request.body.payload ?? {});
			},
			schema: {
				operationId: `render${name}`,
				tags: ['render', name],
				body: Type.Object({
					payload: Type.Ref(schemaId)
				})
			}
		});

		server.route({
			method: 'POST',
			url: path.join(root_, `${name}/send`),
			handler: mkSendHandler(template),

			schema: {
				operationId: `send${name}`,
				tags: ['send', name],
				body: {
					type: 'object',
					content: {
						'application/json': {
							schema: Type.Object({
								payload: Type.Ref(schemaId),
								to_users: Type.Optional(Type.Array(Type.String({ format: 'email' }))),
								to_channels: Type.Optional(Type.Array(Type.String()))
							}, {
								minProperties: 2,
								additionalProperties: false
							}),
							examples: template.examples
						}
					}
				}
			}
		});
	}
}
