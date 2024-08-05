import type { PageLoad } from './$types';

export const load: PageLoad = async (event) => {
	console.log(event)
	return {
		templateData: event.url.searchParams.get('templateData') ?? ''
	}
/*
	const fromParent = await parent();
	console.log('parent:', fromParent)
	fromParent.templates
	return JSON.parse(JSON.stringify(params));
*/

};
