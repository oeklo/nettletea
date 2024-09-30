import Fastify from 'fastify';
import { nettleTea } from './nettletea.js';
import { all as templates } from './lib/templates/index.js';

const server = Fastify({
	logger: true
});

await server.register(import ('@fastify/swagger'), {
	openapi: {	}
});
await server.register(import ('@fastify/swagger-ui'), {
	routePrefix: '/documentation'
});

nettleTea({ server, templates });

server.listen({ port: 3000 }, function(err: Error | null) {
	if (err) {
		server.log.error(err);
		process.exit(1);
	}
});
