<script lang="ts">
	import type { TemplateDescr } from '$lib';
	import { TreeView, TreeViewItem } from '@skeletonlabs/skeleton';
	import { goto } from '$app/navigation';

	export let templates: { [name: string]: TemplateDescr<any> } = {};
	const openWithData = (template: string, exampleName: string)=>goto(`/template/${template}?templateData=${JSON.stringify(templates[template][exampleName])}`)
</script>

<nav>
	<TreeView>
		{#each Object.entries(templates) as [template, examples]}
			<TreeViewItem on:toggle={()=> goto(`/template/${template}`)}>{template}
				<svelte:fragment slot="children">
					{#each Object.keys(examples) as exampleName}
						<TreeViewItem>
							<button class="display-inline"
											on:click|preventDefault={() => openWithData(template, exampleName)}
											on:keypress|preventDefault={() => openWithData(template, exampleName)}
							>
								{exampleName}
							</button>
						</TreeViewItem>
					{/each}
				</svelte:fragment>
			</TreeViewItem>
		{/each}
	</TreeView>
</nav>
