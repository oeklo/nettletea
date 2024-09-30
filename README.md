# Nettle Tea

Template Server for Slack.

## Purpose

Nettle Tea is intended as a transactional message server for Slack.

It exposes endpoints to preview and send messages generated from developer-provided templates and user provided data.

## Usage

Template:
```ts
import type { Template } from '../index.ts';
import { Type } from '@fastify/type-provider-typebox';

interface Data {
	name: string;
}

export default {
	name: 'Hello World',
	fn: ({ name }: Data) => {
		return {
			'blocks': [
				{
					'text': {
						'type': 'mrkdwn',
						'text': `hello ${name}`
					},
					'type': 'section'
				}
			],
			text: `hello ${name}`,
		};
	},
	examples: {
		default: {
			name: 'World'
		}
	},
	schema: Type.Object({
		name: Type.String()
	})
} as Template<Data>;
```

Server:
```ts
import Fastify from 'fastify';
import { nettleTea } from './nettletea.js';
import helloWorld from './template.js';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

const server = Fastify({
	logger: true
}).withTypeProvider<TypeBoxTypeProvider>();

// swagger is currently optional:
await server.register(import ('@fastify/swagger'), {
	openapi: {	}
});
await server.register(import ('@fastify/swagger-ui'), {
	routePrefix: '/documentation'
});

nettleTea({ server, templates: {helloWorld} });

server.listen({ port: 3000 }, function(err: Error | null) {
	if (err) {
		server.log.error(err);
		process.exit(1);
	}
});
```

## Disclaimer

Slack is a trademark and service mark of Slack Technologies, Inc., registered in the U.S. and in other countries.

Neither the author of this project not the project itself are not affiliated with Slack Technologies.
