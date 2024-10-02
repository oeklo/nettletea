import type {ChatPostMessageArguments} from "@slack/web-api";
import type {TSchema} from "@fastify/type-provider-typebox";

export interface Template<Data> {
    examples: { [name: string]: Data };
    fn: (data: Data) => Partial<ChatPostMessageArguments>;
    name: string;
    schema: TSchema;
}

export type Templates<Data> = { [templateName: string]: Template<Data> };