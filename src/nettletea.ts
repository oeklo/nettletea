import path from 'node:path';
import {Type, type TSchemaOptions} from '@fastify/type-provider-typebox';
import type {FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import '@fastify/swagger';
import type {ChatPostMessageArguments, WebClient} from '@slack/web-api';
import i18next, {type TFunction} from 'i18next';

import {createResolvers, getUserId, NotFound, resolveChannelIds, resolveUserIds, SlackNotConfigured} from './slack.js';
import type {Message, Resolvers, Template} from './types.js';

interface PayloadBody {
    payload: unknown;
}

interface PreviewParams {
    mode: 'header' | 'body';
}

type SendTarget = {user: string} | {channel: string};

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

async function renderTemplate<Data>(
    template: Template<Data>,
    data: Data | undefined,
    t: TFunction,
    resolvers: Resolvers,
) {
    const rendered_ = template.fn(data ?? ({} as unknown as Data), t, resolvers);
    return rendered_ instanceof Promise ? await rendered_ : rendered_;
}

async function sendErrorReply(reply: FastifyReply, error: unknown) {
    reply.log.error({error}, 'template handler failed');
    if (error instanceof NotFound) await reply.code(404).send({error: error.name, message: error.message});
    else if (error instanceof SlackNotConfigured)
        await reply.code(503).send({error: error.name, message: error.message});
    else if (error instanceof Error) await reply.code(500).send({error: error.name, message: error.message});
    else throw error;
}

function normalizeTargets(body: SendBody): {to_users: string[]; to_channels: string[]} {
    const to_users = [...(body.to_users ?? [])];
    const to_channels = [...(body.to_channels ?? [])];
    for (const target of body.to ?? []) {
        if ('user' in target) to_users.push(target.user);
        else to_channels.push(target.channel);
    }
    return {to_channels, to_users};
}

interface ResolvedTarget {
    id: string;
    recipient: string;
}

async function resolveTargets({
    overrideTo,
    to_users,
    to_channels,
    slackClient,
}: ResolveTargetArgs): Promise<ResolvedTarget[]> {
    if (overrideTo) {
        return [{id: await getUserId(overrideTo, slackClient), recipient: overrideTo}];
    }
    const userIds = await resolveUserIds(to_users, slackClient);
    const channelIds = await resolveChannelIds(to_channels, slackClient);
    return [
        ...to_users.map((recipient, i) => ({id: userIds[i], recipient})),
        ...to_channels.map((recipient, i) => ({id: channelIds[i], recipient})),
    ];
}

interface SendHandlerArgs {
    template: Template<any>;
    t: TFunction;
    slackClient?: WebClient;
    resolvers: Resolvers;
    overrideTo?: string;
    bccChannel?: string;
}

function mkSendHandler({template, t, slackClient, resolvers, overrideTo, bccChannel}: SendHandlerArgs) {
    return async (request: FastifyRequest<{Body: SendBody}>, reply: FastifyReply) => {
        if (slackClient === undefined) {
            await reply.code(503).send({error: 'Slack sending is disabled: no Slack token configured'});
            return;
        }
        try {
            const rendered = await renderTemplate(template, request.body.payload, t, resolvers);
            if (request.body.to_users || request.body.to_channels) {
                reply.log.warn('to_users/to_channels are deprecated; use `to` instead');
            }
            const {to_channels, to_users} = normalizeTargets(request.body);
            if (bccChannel) to_channels.push(bccChannel);
            const targets = await resolveTargets({
                overrideTo,
                slackClient,
                to_channels,
                to_users,
            });

            const results = await Promise.allSettled(
                targets.map(({id}) =>
                    slackClient.chat.postMessage({
                        channel: id,
                        ...rendered,
                    } as ChatPostMessageArguments),
                ),
            );

            const failed = results.flatMap((result, i) => {
                if (result.status === 'fulfilled') return [];
                const {recipient} = targets[i];
                reply.log.error({error: result.reason, recipient}, 'failed to send to recipient');
                return [
                    {error: result.reason instanceof Error ? result.reason.message : String(result.reason), recipient},
                ];
            });

            if (failed.length > 0) {
                await reply.code(502).send({
                    error: 'SendFailed',
                    failed,
                    message: `failed to send to ${failed.length} of ${targets.length} recipient(s)`,
                });
                return;
            }
            await reply.code(204).send();
        } catch (error) {
            await sendErrorReply(reply, error);
            return;
        }
    };
}

function mkViewHandler(template: Template<any>, t: TFunction, resolvers: Resolvers) {
    return async (request: FastifyRequest<{Body: PayloadBody; Querystring: PreviewParams}>, reply: FastifyReply) => {
        let rendered: Message;
        try {
            rendered = await renderTemplate(template, request.body.payload, t, resolvers);
        } catch (error) {
            await sendErrorReply(reply, error);
            return;
        }
        rendered.text = undefined;
        const location = `https://app.slack.com/block-kit-builder/T4LJR706L#${encodeURIComponent(JSON.stringify(rendered))}`;
        // can't use location header dues to CORS
        reply.code(303);
        if (request.query.mode !== 'body') await reply.header('Location', location).send();
        else await reply.header('content-type', 'text/plain').send(location);
    };
}

interface NettleTeaArgs {
    bccChannel?: string;
    lang?: string;
    overrideTo?: string;
    root: string;
    server: FastifyInstance;
    slackClient?: WebClient;
    templates: {[templateName: string]: Template<any>};
}

export async function nettleTea(opts: NettleTeaArgs) {
    const resolvers = createResolvers(opts.slackClient);

    const root_ = path.join(opts.root, '/t');

    const i18n = i18next.createInstance();
    await i18n.init({
        lng: opts.lang ?? 'en',
    });

    for (const [name, template] of Object.entries(opts.templates)) {
        const schemaId = (template.schema as TSchemaOptions).$id ?? `${name}Input`;
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
            handler: async (
                request: FastifyRequest<{
                    Body: PayloadBody;
                }>,
                reply: FastifyReply,
            ) => {
                try {
                    return await renderTemplate(template, request.body.payload as any, t, resolvers);
                } catch (error) {
                    await sendErrorReply(reply, error);
                    return;
                }
            },
            method: 'POST',
            schema: {
                body: Type.Object({
                    payload: Type.Ref(schemaId),
                }),
                operationId: name,
            },
            url: path.join(root_, name),
        });

        const url = path.join(root_, `${name}/send`);
        const handler = mkSendHandler({
            bccChannel: opts.bccChannel,
            overrideTo: opts.overrideTo,
            resolvers,
            slackClient: opts.slackClient,
            t,
            template,
        });
        opts.server.route({
            handler,
            method: 'POST',

            schema: {
                body: {
                    content: {
                        'application/json': {
                            examples: template.examples,
                            schema: Type.Union([
                                Type.Object(
                                    {
                                        payload: Type.Ref(schemaId),
                                        to: Type.Array(
                                            Type.Union([
                                                Type.Object({user: Type.String({format: 'email'})}),
                                                Type.Object({channel: Type.String()}),
                                            ]),
                                            {minItems: 1},
                                        ),
                                    },
                                    {
                                        additionalProperties: false,
                                    },
                                ),
                                Type.Object(
                                    {
                                        payload: Type.Ref(schemaId),
                                        to_channels: Type.Optional(Type.Array(Type.String())),
                                        to_users: Type.Optional(Type.Array(Type.String({format: 'email'}))),
                                    },
                                    {
                                        additionalProperties: false,
                                        minProperties: 2,
                                    },
                                ),
                            ]),
                        },
                    },
                    type: 'object',
                },
                operationId: `${name}Send`,
                response: {
                    '204': {
                        description: 'Successful response',
                        type: 'null',
                    },
                    '502': {
                        description: 'One or more recipients failed to receive the message',
                        properties: {
                            error: {type: 'string'},
                            failed: {
                                items: {
                                    properties: {
                                        error: {type: 'string'},
                                        recipient: {type: 'string'},
                                    },
                                    type: 'object',
                                },
                                type: 'array',
                            },
                            message: {type: 'string'},
                        },
                        type: 'object',
                    },
                    '503': {
                        description: 'Slack sending is disabled because no Slack token is configured',
                        properties: {
                            error: {type: 'string'},
                            message: {type: 'string'},
                        },
                        type: 'object',
                    },
                },
            },
            url,
        });

        opts.server.route({
            handler: mkViewHandler(template, t, resolvers),
            method: 'POST',

            schema: {
                body: {
                    content: {
                        'application/json': {
                            examples: template.examples,
                            schema: Type.Object(
                                {
                                    payload: Type.Ref(schemaId),
                                },
                                {
                                    additionalProperties: false,
                                },
                            ),
                        },
                    },
                    type: 'object',
                },
                operationId: `${name}Preview`,
                querystring: {
                    properties: {
                        mode: {
                            default: 'body',
                            enum: ['body', 'header'],
                            type: 'string',
                        },
                    },
                    type: 'object',
                },
                response: {
                    '303': {
                        description: 'Successful response',
                        type: 'string',
                    },
                },
            },
            url: path.join(root_, `${name}/preview`),
        });
    }
}
