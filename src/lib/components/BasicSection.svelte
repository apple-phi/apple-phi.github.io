<script lang="ts">
	export let title: string;
	export let gridEffect: boolean = false;

	import BgGridEffect from '$lib/components/BgGridEffect.svelte';
</script>

<svelte:head>
	<title>{title} | Lucas Ng</title>
</svelte:head>

{#if gridEffect}
	<BgGridEffect />
{/if}

<section class="sm:pt-30 relative flex w-screen p-7 pt-20 md:pt-40">
	<div class="mx-auto sm:w-3/4 lg:w-1/2">
		<div class="pb-8 pt-12 text-left">
			<h1
				class="font-display text-3xl underline decoration-orange-500 decoration-wavy underline-offset-8 sm:text-4xl"
			>
				{title}
			</h1>
		</div>
		<slot></slot>
	</div>
</section>
