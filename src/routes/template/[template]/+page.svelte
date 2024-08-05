<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ProgressBar } from '@skeletonlabs/skeleton';

	export let rendered: string | null = null;
	let templateData: any;
	$: templateData = $page.data.templateData;

	const render = async (value: string): Promise<string> => {
		return await (await fetch(`/api/template/${$page.params.template}`, {
			method: 'POST',
			body: value
		})).text();
	};

	const tryRender = async (value: string | null): Promise<string | null> => {
		if (!value)
			return null

		try{
			JSON.parse(templateData)
		}catch {
			return null;
		}

		return await render(templateData);
	};

	const onClick = async () => {
		rendered = null;
		const rendered_ = await tryRender(templateData);
		if (rendered_)
			rendered = rendered_;
	};

	onMount(() => render(templateData));
</script>

<div><textarea class="text-black w-1/2" rows="10" bind:value={templateData} /></div>

<button type="button" class="btn bg-surface-500 text-black" on:click={onClick}>Render</button>

<div>
	{#if !rendered}
		<ProgressBar value={undefined} />
	{:else}
		<textarea class="text-black w-1/2" rows="10" bind:value={rendered} />
	{/if}
</div>
