import type { RequestHandler } from '@sveltejs/kit';
import { type TemplateDescriptors } from '$lib';

import { templateDescrs } from '$lib/template/stores';

/*
import path from 'path';
const templatesDir = path.resolve('src/lib/templates');

const importTemplate = async (filePath: string) => {
	const modulePath = path.relative(__dirname, filePath);
	const imported= await import(`../../../../${modulePath}`) as { default: Template<any> };
	return imported.default
}

const templateDescrs = (async function(): Promise<{ [name: string]: TemplateDescr<any> }> {
	const templateFiles = await fs.readdir(templatesDir);
	const templates: { [name: string]: Template<any> } = {};
	for (const file of templateFiles) {
		if (!file.endsWith('.ts'))
			continue;
		const filePath = path.join(templatesDir, file);
		const template = await importTemplate(filePath)
		const name = file.substring(0, file.length - 3);
		templates[name] = template;
	}

	return Object.fromEntries(Object.entries(templates).map(([name, template]) => [name, {
		name: template.name,
		examples: template.examples
	}]));
})();
*/

let servedTemplates: TemplateDescriptors<any>|null = null;
templateDescrs.subscribe((value) => {
	servedTemplates = value;
});

export const GET: RequestHandler = async () => {
	return new Response(JSON.stringify({
		templates: servedTemplates
	}));
};
