import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import { nettleTea } from '../src';
import { all as templates } from './templates';

const server = Fastify({
	logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();

await server.register(import('@fastify/swagger'), {
	openapi: {},
});
await server.register(import('@fastify/swagger-ui'), {
	routePrefix: '/documentation',
});

await nettleTea({
	server,
	templates,
	slackToken: process.env.SlackToken!,
});

server.listen({ port: 3000, host: '::' }, (err: Error | null) => {
	if (err) {
		server.log.error(err);
		process.exit(1);
	}
});
