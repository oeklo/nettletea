<script lang="ts">
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';

	export let rendered: string | null = null;
	let templateData: string;

	const render = async (value: string): Promise<string> => {
		console.log('page store:', $page);
		return await (await fetch(`/api/template/${$page.params.template}`, {
			method: 'POST',
			body: value
		})).text();
	};

	const tryRender = async (value: string | null): Promise<void> => {
		if (!value)
			return;

		try {
			JSON.parse(value);
		} catch (error) {
			console.log(error);
			return;
		}

		const rendered_ = await render(templateData);
		if (rendered_)
			rendered = rendered_;
	};

	afterNavigate(() => {
		templateData = $page.data.templateData;
	});
</script>

<div>
	<textarea class="w-full p-4 rounded-box" rows="10" bind:value={templateData} placeholder="Template data" />
</div>

<div class="py-4">
	<button type="button" class="btn" on:click={async () => await tryRender(templateData)}>
		Render
	</button>
</div>

<div>
	<textarea class="w-full p-4 rounded-box" rows="10" bind:value={rendered} readonly placeholder="Preview" />
</div>
