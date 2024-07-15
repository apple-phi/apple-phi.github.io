<script lang="ts">
	export let data;

	const { title, subtitle, date, tags } = data.meta;
	const { PostContent } = data;
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
				{@html title}
			</h1>
			<h2 class="mt-2 inline-block bg-stone-50 text-lg !leading-relaxed text-gray-500">
				{@html subtitle}
			</h2>
			{#if tags?.length > 0}
				<div class="mt-4 flex flex-wrap gap-2">
					{#each tags as tag}
						<a
							href="/blog?tag={encodeURIComponent(tag)}"
							class="inline-block rounded-full border border-gray-400 px-2 py-1 text-sm
														text-gray-500 transition-transform hover:scale-110"
						>
							{tag}
						</a>
					{/each}
				</div>
			{/if}
		</div>
		<div
			class="sm:prose-md prose prose-sm min-w-full text-pretty pb-20 text-justify md:prose-lg sm:max-w-screen-sm"
		>
			<PostContent />
		</div>
	</div>
</section>
