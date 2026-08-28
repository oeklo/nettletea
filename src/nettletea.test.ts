import {Type} from '@fastify/type-provider-typebox';
import Fastify from 'fastify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {nettleTea} from './nettletea.js';
import type {Template} from './types.js';

const mocks = vi.hoisted(() => ({
    conversationsList: vi.fn(),
    lookupByEmail: vi.fn(),
    postMessage: vi.fn(),
}));

vi.mock('@slack/web-api', () => {
    class WebClient {
        chat = {postMessage: mocks.postMessage};
        users = {lookupByEmail: mocks.lookupByEmail};
        conversations = {list: mocks.conversationsList};
        constructor(
            public token?: string,
            public options?: unknown,
        ) {}
    }
    return {
        default: {retryPolicies: {tenRetriesInAboutThirtyMinutes: {}}},
        ErrorCode: {PlatformError: 'platform_error'},
        WebClient,
    };
});

const testTemplate: Template<{name: string}> = {
    examples: {default: {name: 'World'}},
    fn: ({name}) => ({blocks: [], text: `hello ${name}`}),
    name: 'Test',
    schema: Type.Object({name: Type.String()}),
};

const resolvingTemplate: Template<{email: string}> = {
    examples: {default: {email: 'a@b.com'}},
    fn: async ({email}, _t, {resolveUserIds}) => {
        const [id] = await resolveUserIds([email]);
        return {blocks: [], text: id};
    },
    name: 'Resolving',
    schema: Type.Object({email: Type.String()}),
};

const defaultOpts = {
    root: '/',
    slackOptions: {},
    slackToken: 'xoxb-test',
};

beforeEach(() => {
    mocks.postMessage.mockReset().mockResolvedValue({ok: true});
    mocks.lookupByEmail.mockReset();
    mocks.conversationsList.mockReset().mockResolvedValue({channels: []});
});

describe('nettleTea routes', () => {
    it('POST /t/<name> renders without calling Slack', async () => {
        const server = Fastify();
        await nettleTea({...defaultOpts, server, templates: {test: testTemplate}});

        const res = await server.inject({
            method: 'POST',
            payload: {payload: {name: 'World'}},
            url: '/t/test',
        });

        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({text: 'hello World'});
        expect(mocks.postMessage).not.toHaveBeenCalled();
    });

    it('POST /t/<name>/send resolves the user and posts to their id', async () => {
        mocks.lookupByEmail.mockResolvedValue({ok: true, user: {id: 'U123'}});

        const server = Fastify();
        await nettleTea({...defaultOpts, server, templates: {test: testTemplate}});

        const res = await server.inject({
            method: 'POST',
            payload: {payload: {name: 'World'}, to: [{user: 'a@b.com'}]},
            url: '/t/test/send',
        });

        expect(res.statusCode).toBe(204);
        expect(mocks.postMessage).toHaveBeenCalledWith(expect.objectContaining({channel: 'U123'}));
    });

    it('overrideTo forces every send to the override target, ignoring the requested `to`', async () => {
        mocks.lookupByEmail.mockImplementation(async ({email}: {email: string}) =>
            email === 'staging@x.com' ? {ok: true, user: {id: 'USTAGING'}} : {ok: true, user: {id: 'UREAL'}},
        );

        const server = Fastify();
        await nettleTea({
            ...defaultOpts,
            overrideTo: 'staging@x.com',
            server,
            templates: {test: testTemplate},
        });

        const res = await server.inject({
            method: 'POST',
            payload: {payload: {name: 'World'}, to: [{user: 'a@b.com'}]},
            url: '/t/test/send',
        });

        expect(res.statusCode).toBe(204);
        expect(mocks.postMessage).toHaveBeenCalledTimes(1);
        expect(mocks.postMessage).toHaveBeenCalledWith(expect.objectContaining({channel: 'USTAGING'}));
    });

    it('POST /t/<name>/preview?mode=header redirects to a Block Kit Builder URL', async () => {
        const server = Fastify();
        await nettleTea({...defaultOpts, server, templates: {test: testTemplate}});

        const res = await server.inject({
            method: 'POST',
            payload: {payload: {name: 'World'}},
            url: '/t/test/preview?mode=header',
        });

        expect(res.statusCode).toBe(303);
        expect(res.headers.location).toContain('https://app.slack.com/block-kit-builder/');
    });

    it('POST /t/<name>/preview with no querystring defaults to a plain-text body, not a redirect header', async () => {
        // The querystring schema declares `default: 'body'` for `mode`, so with
        // no querystring at all the plain-text branch runs, not the Location
        // redirect - this is the actual current behavior, not documentation.
        const server = Fastify();
        await nettleTea({...defaultOpts, server, templates: {test: testTemplate}});

        const res = await server.inject({
            method: 'POST',
            payload: {payload: {name: 'World'}},
            url: '/t/test/preview',
        });

        expect(res.statusCode).toBe(303);
        expect(res.headers.location).toBeUndefined();
        expect(res.headers['content-type']).toContain('text/plain');
        expect(res.body).toContain('https://app.slack.com/block-kit-builder/');
    });

    it('POST /t/<name>/send returns 404 when the user cannot be resolved', async () => {
        mocks.lookupByEmail.mockResolvedValue({ok: false});

        const server = Fastify();
        await nettleTea({...defaultOpts, server, templates: {test: testTemplate}});

        const res = await server.inject({
            method: 'POST',
            payload: {payload: {name: 'World'}, to: [{user: 'missing@x.com'}]},
            url: '/t/test/send',
        });

        expect(res.statusCode).toBe(404);
    });

    it('POST /t/<name>/send returns 502 with per-recipient failures, still attempting every target', async () => {
        mocks.lookupByEmail.mockImplementation(async ({email}: {email: string}) =>
            email === 'good@x.com' ? {ok: true, user: {id: 'UGOOD'}} : {ok: true, user: {id: 'UBAD'}},
        );
        mocks.postMessage.mockImplementation(async ({channel}: {channel: string}) => {
            if (channel === 'UBAD') throw new Error('user_is_restricted');
            return {ok: true};
        });

        const server = Fastify();
        await nettleTea({...defaultOpts, server, templates: {test: testTemplate}});

        const res = await server.inject({
            method: 'POST',
            payload: {payload: {name: 'World'}, to: [{user: 'good@x.com'}, {user: 'bad@x.com'}]},
            url: '/t/test/send',
        });

        expect(res.statusCode).toBe(502);
        expect(mocks.postMessage).toHaveBeenCalledTimes(2);
        expect(res.json()).toMatchObject({
            failed: [{error: 'user_is_restricted', recipient: 'bad@x.com'}],
        });
    });

    describe('without a Slack token configured', () => {
        it('POST /t/<name> still renders', async () => {
            const server = Fastify();
            await nettleTea({...defaultOpts, server, slackToken: undefined, templates: {test: testTemplate}});

            const res = await server.inject({
                method: 'POST',
                payload: {payload: {name: 'World'}},
                url: '/t/test',
            });

            expect(res.statusCode).toBe(200);
            expect(res.json()).toMatchObject({text: 'hello World'});
        });

        it('POST /t/<name>/send returns 503 without attempting to resolve or post anything', async () => {
            const server = Fastify();
            await nettleTea({...defaultOpts, server, slackToken: undefined, templates: {test: testTemplate}});

            const res = await server.inject({
                method: 'POST',
                payload: {payload: {name: 'World'}, to: [{user: 'a@b.com'}]},
                url: '/t/test/send',
            });

            expect(res.statusCode).toBe(503);
            expect(res.json()).toMatchObject({error: expect.stringContaining('no Slack token')});
            expect(mocks.lookupByEmail).not.toHaveBeenCalled();
            expect(mocks.postMessage).not.toHaveBeenCalled();
        });

        it('POST /t/<name> returns 503 if the template itself calls a resolver', async () => {
            const server = Fastify();
            await nettleTea({...defaultOpts, server, slackToken: undefined, templates: {resolving: resolvingTemplate}});

            const res = await server.inject({
                method: 'POST',
                payload: {payload: {email: 'a@b.com'}},
                url: '/t/resolving',
            });

            expect(res.statusCode).toBe(503);
            expect(res.json()).toMatchObject({
                error: 'SlackNotConfigured',
                message: expect.stringContaining('no Slack token'),
            });
            expect(mocks.lookupByEmail).not.toHaveBeenCalled();
        });
    });
});
