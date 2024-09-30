import type { ChatPostMessageArguments } from '@slack/web-api';

export type TemplateDescr<Data> = { [name: string]: Data }
export type TemplateDescriptors<Data> = { [templateName: string]: TemplateDescr<Data> };

export interface Template<Data> {
	examples: { [name: string]: Data };
	fn: (data: Data) => Partial<ChatPostMessageArguments>;
	name: string;
}

export type Templates<Data> = { [templateName: string]: Template<Data> };
