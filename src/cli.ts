#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import path from 'node:path';
import type {TypeBoxTypeProvider} from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {discoverTemplates} from './discover.js';
import {nettleTea} from './nettletea.js';

function readPkg(): {version: string} {
    return JSON.parse(readFileSync(path.join(import.meta.dirname, '../package.json'), 'utf8'));
}

function createServer() {
    return Fastify({logger: true}).withTypeProvider<TypeBoxTypeProvider>();
}

async function registerDocumentation(server: ReturnType<typeof createServer>) {
    await server.register(import('@fastify/swagger'), {
        openapi: {
            info: {
                title: 'nettletea',
                version: readPkg().version,
            },
        },
    });
    await server.register(import('@fastify/swagger-ui'), {
        routePrefix: '/documentation',
    });
}

async function main() {
    const argv = await parseArgs();

    const slackToken = process.env.SLACK_TOKEN;
    if (!slackToken) {
        console.warn('No SLACK_TOKEN set.');
    }

    const templatesDir = path.resolve(process.cwd(), argv.templates);

    const server = createServer();

    if (argv.swagger) {
        await registerDocumentation(server);
    }

    const templates = await discoverTemplates(templatesDir);

    await nettleTea({
        lang: argv.lang,
        overrideTo: argv.overrideTo,
        root: argv.root,
        server,
        slackToken,
        templates,
    });

    for (const signal of ['SIGINT', 'SIGTERM'] as const) {
        process.on(signal, () => {
            server.close().then(() => process.exit(0));
        });
    }

    server.listen({host: argv.host, port: argv.port}, (err: Error | null) => {
        if (err) {
            server.log.error(err);
            process.exit(1);
        }
    });
}

async function parseArgs() {
    return yargs(hideBin(process.argv))
        .scriptName('nettletea')
        .options({
            host: {
                default: '::',
                describe: 'Host to bind to',
                type: 'string',
            },
            lang: {
                describe: 'Default i18next language',
                type: 'string',
            },
            'override-to': {
                describe: 'Force every send to one address',
                type: 'string',
            },
            port: {
                alias: 'p',
                default: 3000,
                describe: 'Port to listen on',
                type: 'number',
            },
            root: {
                default: '/',
                describe: 'Route prefix',
                type: 'string',
            },
            swagger: {
                default: false,
                describe: 'Serve OpenAPI docs (JSON, YAML, and UI) at /documentation',
                type: 'boolean',
            },
            templates: {
                alias: 't',
                default: './templates',
                describe: 'Templates directory',
                type: 'string',
            },
        })
        .env()
        .help()
        .version(readPkg().version)
        .parse();
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
