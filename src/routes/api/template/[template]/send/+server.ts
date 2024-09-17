import type { RequestHandler } from '@sveltejs/kit';
import { SLACK__TOKEN, SLACK__USER_EMAIL } from '$env/static/private';
import { WebClient, type ChatPostMessageArguments } from '@slack/web-api';
import type { Templates } from '$lib';
import { templates } from '$lib/template/stores';


let $templates: Templates<any> | null = null;
templates.subscribe(value => $templates = value);

const web = new WebClient(SLACK__TOKEN);

export const POST: RequestHandler = async (request) => {
	const requestBody = await request.request.json();

	try {
		const user = await web.users.lookupByEmail({ email: SLACK__USER_EMAIL });

		if (!user.ok) {
			return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
		}
		const userId = user.user!.id!;
		console.log(userId);

		const templateName = request.params.template;
		const template = $templates![templateName!];
		const rendered = template.fn(requestBody ?? {});

		const message = {
			channel: userId,
			...rendered
		} as ChatPostMessageArguments;
		console.log({ message });

		const postResp = await web.chat.postMessage(message);
		console.log({ postResp });

		// return new Response(JSON.stringify(rendered));
		return new Response(JSON.stringify(postResp));
	} catch (error) {
		console.log(error);
		return new Response(JSON.stringify(error), { status: 400 });
	}
};
