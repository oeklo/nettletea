<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import type { LayoutData } from './$types';


	export let data: LayoutData;

</script>

<div class="flex h-screen">
	<div class="w-1/4 border-r border-main bg-secondary p-4 text-white">
		<Sidebar templates={data.templates}/>
	</div>
	<main class="w-3/4 p-4">
		<slot />
	</main>
</div>
