<script lang="ts">
	import type { TemplateDescr } from '$lib';

	export let templates: { [name: string]: TemplateDescr<any> } = {};
</script>

<ul class="menu bg-base-200 rounded-box">
	{#each Object.entries(templates) as [template, examples]}
		<li>
			<details>
				<summary><a href={`/${template}`}>{template}</a></summary>
				<ul>
					{#each Object.keys(examples) as exampleName}
						<li>
							<a
								href={`/${template}?templateData=${JSON.stringify(templates[template][exampleName])}`}>{exampleName}</a>
						</li>
					{/each}
				</ul>
			</details>
		</li>
	{/each}
</ul>
