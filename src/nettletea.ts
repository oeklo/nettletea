import path from 'node:path';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { type Template, Templates } from './lib/index.js';
import { type ChatPostMessageArguments, WebClient } from '@slack/web-api';

interface NettleTeaArgs {
	server: FastifyInstance,
	root?: string
	templates: { [templateName: string]: Template<any> }
}

function mkRootHandler(templates: Templates<any>) {
	return async function(request: FastifyRequest, reply: FastifyReply) {
		console.log(request, reply);
		return {
			templates: Object.fromEntries(Object.entries(templates).map(([name, template]) => [name, {
				name: template.name,
				examples: template.examples
			}]))
		};
	};
}

interface RenderQuery {
	templateName: string;
}

function mkRenderHandler(templates: Templates<any>) {
	return async function(request: FastifyRequest<{ Params: RenderQuery }>, reply: FastifyReply) {

		const templateName = request.params.templateName;
		if (!Object.keys(templates).includes(templateName)) {
			reply.status(404).send({ error: 'template not found' });
			return;
		}

		const template = templates[templateName];
		return template.fn(request.body ?? {});
	};
}

function mkSendHandler(templates: Templates<any>) {
	const web = new WebClient(process.env.SLACK__TOKEN);
	return async function(request: FastifyRequest<{ Params: RenderQuery }>, reply: FastifyReply) {
		const templateName = request.params.templateName;
		if (!Object.keys(templates).includes(templateName)) {
			reply.status(404).send({ error: 'template not found' });
		}

		const user = await web.users.lookupByEmail({ email: process.env.SLACK__USER_EMAIL! });
		if (!user.ok)
			return reply.code(404).send({ error: 'User not found' });

		const userId = user.user!.id!;

		const template = templates[templateName];
		const rendered = template.fn(request.body ?? {});


		const message = {
			channel: userId,
			...rendered,
		} as ChatPostMessageArguments;
		console.log({ message });

		return await web.chat.postMessage(message);
	};
}

export function nettleTea({ server, root, templates }: NettleTeaArgs) {
	const root_ = path.join(root ?? '/', '/');

	// TODO turn to openapi
	server.get(root_, mkRootHandler(templates));

	server.route({
		method: 'POST',
		url: path.join(root_, ':templateName'),
		handler: mkRenderHandler(templates)
	});

	server.route({
		method:'POST',
		url: path.join(root_, ':templateName/send'),
		handler: mkSendHandler(templates)
	})
}
