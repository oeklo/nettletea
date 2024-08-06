import type { RequestHandler } from '@sveltejs/kit';
import { templates } from '$lib/template/stores';
import type { Templates } from '$lib';

let $templates: Templates<any> | null = null;
templates.subscribe(value => $templates = value);

export const POST: RequestHandler = async (request) => {
	try {
		let requestBody = await request.request.json();
		const templateName = request.params.template;
		const template = $templates![templateName!];
		const rendered = template.fn(requestBody ?? {});
		return new Response(JSON.stringify(rendered));
	}catch (error){
		return new Response(JSON.stringify(error),{status:400});
	}
};
