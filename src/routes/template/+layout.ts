import type { TemplateDescr } from '$lib';
import { error } from '@sveltejs/kit';

export const load = async (event) => {
	let response = await (await event.fetch('/api/template')).json() as {
		templates: { [name: string]: TemplateDescr<any> }
	} | undefined;
	if (response === undefined) {
		throw error(404, 'Templates not found');
	}
	return { templates: response.templates };
};
