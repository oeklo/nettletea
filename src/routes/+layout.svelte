<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
	import '../styles.scss';
	import "tailwindcss/tailwind.css";
</script>

<div class="flex flex-row min-h-screen justify-between prose">
	<aside class="flex flex-col w-1/4 ">
		<header>
		</header>
		<main class="flex-1 p-4"><Sidebar templates={data.templates} /></main>
		<footer class="text-center text-xs">
			Nettle Tea
		</footer>
	</aside>
	<main class="w-3/4 p-4 flex-1">
		<slot />
	</main>
</div>
