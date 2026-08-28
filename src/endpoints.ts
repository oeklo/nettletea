import type {WebClient} from '@slack/web-api';
import type {FastifyReply, FastifyRequest} from 'fastify';

const READY_CACHE_TTL_MS = 10_000;

interface ReadyCache {
    checkedAt: number;
    result: 'ok' | 'unreachable';
}

export function mkReadinessHandler(slackClient?: WebClient) {
    let cache: ReadyCache | undefined;

    return async (_: FastifyRequest, reply: FastifyReply) => {
        if (slackClient === undefined) return {slack: 'disabled', status: 'ok'};

        if (!cache || Date.now() - cache.checkedAt > READY_CACHE_TTL_MS) {
            try {
                await slackClient.auth.test();
                cache = {checkedAt: Date.now(), result: 'ok'};
            } catch (error) {
                reply.log.error({error}, 'readiness: slack auth.test failed');
                cache = {checkedAt: Date.now(), result: 'unreachable'};
            }
        }

        if (cache.result === 'unreachable') {
            reply.code(503);
            return {slack: 'unreachable', status: 'error'};
        }
        return {slack: 'ok', status: 'ok'};
    };
}
