<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
	import '../styles.scss';
	import { AppBar } from '@skeletonlabs/skeleton';
</script>

<div class="flex flex-row min-h-screen justify-between ">
	<aside class="flex flex-col w-1/4 border-r border-main bg-primary-300-600-token text-primary-900-50-token">
		<header>
			<AppBar background="bg-primary-500-400-token" regionRowMain="text-center w-full mx-auto" class="text-3xl bg-primary-500-400-token text-primary-50-900-token text-center">
				<svelte:fragment >Example</svelte:fragment>
			</AppBar>
		</header>
		<main class="flex-1 p-4"><Sidebar templates={data.templates} /></main>
		<footer class="bg-primary-500-400-token text-primary-100-800-token text-center text-xs">
			Nettle Tea
		</footer>
	</aside>
	<main class="w-3/4 p-4 flex-1 bg-primary-50-900-token text-primary-900-50-token">
		<slot />
	</main>
</div>
