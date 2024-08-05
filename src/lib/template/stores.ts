import { derived, type Readable, readable } from 'svelte/store';
import type { Template, TemplateDescr } from '$lib';

const getTemplates = async () => {
	return {
		helloworld: (await import('$lib/templates/helloworld') as { default: Template<any> }).default,
		currentTime: (await import('$lib/templates/currentTime') as { default: Template<any> }).default,
	};
};
export const templates = readable<any>(null, (set) => {
	getTemplates().then(set);
});

function asDescriptor<T>(template: Template<T>): TemplateDescr<T> {
	return template.examples;
}

function asDescriptors(templates: { [name: string]: Template<any> }): { [name: string]: TemplateDescr<any> } {
	return Object.fromEntries(Object.entries(templates).map(([name, template]) => [name, asDescriptor(template)]));
}

export const templateDescrs = derived<
	Readable<any>	,
	{[name: string]: TemplateDescr<any>}
>(templates, (templates) => templates ? asDescriptors(templates) : {});
