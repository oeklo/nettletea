import {Type} from '@fastify/type-provider-typebox';
import type {Template} from '../../src/types.js';

export interface Data {
    name: string;
    email: string;
}

export default {
    examples: {
        default: {
            email: 'world@example.com',
            name: 'World',
        },
    },
    fn: async ({name, email}: Data, _t, {resolveUserIds}) => {
        const [id] = await resolveUserIds([email]);
        const text = `hello ${name} (${id})`;
        return {
            blocks: [
                {
                    text: {
                        text,
                        type: 'mrkdwn',
                    },
                    type: 'section',
                },
            ],
            text,
        };
    },
    name: 'Hello World',
    schema: Type.Object({
        email: Type.String({format: 'email'}),
        name: Type.String(),
    }),
} as Template<Data>;
