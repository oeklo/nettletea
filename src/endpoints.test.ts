import type {FastifyReply, FastifyRequest} from 'fastify';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {mkReadinessHandler} from './endpoints.js';

const mocks = vi.hoisted(() => ({
    authTest: vi.fn(),
}));

const fakeSlackClient = {auth: {test: mocks.authTest}} as any;

function mkReply() {
    return {
        code: vi.fn().mockReturnThis(),
        log: {error: vi.fn()},
    } as unknown as FastifyReply;
}

const request = {} as FastifyRequest;

beforeEach(() => {
    mocks.authTest.mockReset().mockResolvedValue({ok: true});
});

describe('mkReadinessHandler', () => {
    it('returns disabled without calling Slack when no client is configured', async () => {
        const handler = mkReadinessHandler(undefined);
        const reply = mkReply();

        const body = await handler(request, reply);

        expect(body).toEqual({slack: 'disabled', status: 'ok'});
        expect(reply.code).not.toHaveBeenCalled();
        expect(mocks.authTest).not.toHaveBeenCalled();
    });

    it('returns ok when auth.test succeeds', async () => {
        const handler = mkReadinessHandler(fakeSlackClient);
        const reply = mkReply();

        const body = await handler(request, reply);

        expect(body).toEqual({slack: 'ok', status: 'ok'});
        expect(reply.code).not.toHaveBeenCalled();
    });

    it('returns 503 when auth.test fails', async () => {
        mocks.authTest.mockRejectedValue(new Error('invalid_auth'));

        const handler = mkReadinessHandler(fakeSlackClient);
        const reply = mkReply();

        const body = await handler(request, reply);

        expect(body).toEqual({slack: 'unreachable', status: 'error'});
        expect(reply.code).toHaveBeenCalledWith(503);
    });

    it('caches the result within the TTL, without calling auth.test again', async () => {
        const handler = mkReadinessHandler(fakeSlackClient);

        await handler(request, mkReply());
        await handler(request, mkReply());

        expect(mocks.authTest).toHaveBeenCalledTimes(1);
    });
});
