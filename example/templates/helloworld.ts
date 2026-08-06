import {Type} from '@fastify/type-provider-typebox';
import type {Template} from '../../src/types.js';

export interface Data {
    name: string;
}

export default {
    examples: {
        default: {
            name: 'World',
        },
    },
    fn: ({name}: Data) => {
        return {
            blocks: [
                {
                    text: {
                        text: `hello ${name}`,
                        type: 'mrkdwn',
                    },
                    type: 'section',
                },
            ],
            text: `hello ${name}`,
        };
    },
    name: 'Hello World',
    schema: Type.Object({
        name: Type.String(),
    }),
} as Template<Data>;
