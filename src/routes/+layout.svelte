<script>
	import '../styles.scss';
	import { AppBar } from '@skeletonlabs/skeleton';
</script>

<div class="flex flex-col min-h-screen justify-between bg-primary-900 text-primary-50">
	<header>
		<AppBar background='bg-primary'>
			<svelte:fragment slot="headline"><span >Nettle Tea</span></svelte:fragment>
		</AppBar>
	</header>
	<main class="bg-secondary-dark p-4 text-white"><slot /></main>
	<footer class="bg-surface-500 text-black">
		Nettle Tea
	</footer>
</div>
