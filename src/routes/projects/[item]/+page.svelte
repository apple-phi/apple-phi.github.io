<script lang="ts">
	import BgGridEffect from '$lib/components/BgGridEffect.svelte';
	import { calendarIcon, labelIcon } from '$lib/svg';

	export let data;

	const { title, subtitle, date, tags } = data.meta;
	const { ProjectContent } = data;
</script>

<svelte:head>
	<title>{title} | Lucas Ng</title>
	<meta data-key="description" name="description" content={subtitle} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={`{title} | Lucas Ng`} />
	<meta name="twitter:title" content={`{title} | Lucas Ng`} />
	<meta property="og:description" content={subtitle} />
	<meta name="twitter:description" content={subtitle} />
</svelte:head>

<section class="relative flex w-screen p-7 pt-40">
	<div class="mx-auto space-y-12 sm:w-3/4 lg:w-1/2">
		<div class="text-left">
			<h1 class="font-sans text-3xl font-bold sm:text-4xl">
				{title}
			</h1>
			<h2 class="mt-2 inline-block bg-stone-50 text-lg !leading-relaxed text-gray-500">
				{subtitle}
			</h2>
			<div class="mt-6 flex gap-6">
				{#if date}
					<div class="flex items-center">
						<img src={calendarIcon} class="inline-block h-6 w-6" alt="Calendar icon" />
						<p class="ml-1 text-xs text-gray-500">{date}</p>
					</div>
				{/if}
				{#if tags?.length > 0}
					<div class="flex items-center">
						<img src={labelIcon} class="inline-block h-6 w-6" alt="Label icon" />
						<p class="ml-1 text-xs text-gray-500">{tags.join(', ')}</p>
					</div>
				{/if}
			</div>
		</div>
		<ProjectContent />
	</div>
</section>
