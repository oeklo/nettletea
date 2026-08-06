import {Type} from '@fastify/type-provider-typebox';
import type {Template} from '../../src/types.js';

enum Priority {
    Low = 'low',
    High = 'high',
}

export interface Data {
    priority: Priority;
    message: string;
}

export default {
    examples: {
        default: {
            message: 'demonstrates the tsx/ts-node opt-in loader path',
            priority: Priority.High,
        },
    },
    fn: ({priority, message}: Data) => {
        const prefix = priority === Priority.High ? ':rotating_light: HIGH' : 'low';
        const text = `[${prefix}] ${message}`;
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
    name: 'With Enum',
    schema: Type.Object({
        message: Type.String(),
        priority: Type.Enum(Priority),
    }),
} as Template<Data>;
