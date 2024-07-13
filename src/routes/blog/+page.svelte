<script lang="ts">
	let { data } = $props();

	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Accordion, Collapsible } from 'bits-ui';

	import type { BlogPostMetadata } from '$lib/blog';
	import { linkIcon, labelIcon } from '$lib/svg';
	import BasicSection from '$lib/components/BasicSection.svelte';

	let selectedTags = $state([] as string[]);
	onMount(() => {
		// Search params are not allowed to be pre-rendered in SvelteKit
		data.url.searchParams.getAll('tag').map((tag) => selectedTags.push(decodeURIComponent(tag)));
	});

	// When the selectedTags change, set the URL search params
	$effect(() => {
		const searchParams = new URLSearchParams();
		selectedTags.forEach((tag) => searchParams.append('tag', tag));
		// SvelteKit doesn't yet support the Svelte 5 version of `replaceState` so we have to use the `history` object directly
		history.replaceState(
			null,
			'',
			`${location.pathname}${selectedTags.length > 0 ? '?' : ''}${searchParams}`
		);
	});

	function displayPost(post: BlogPostMetadata) {
		if (!selectedTags.length) return true;
		if (!post.tags) return false;
		return selectedTags.every((tag) => post.tags?.includes(tag));
	}

	function toggleTag(tag: string) {
		try {
			document.querySelector('body')?.scrollIntoView({ behavior: 'smooth' });
		} catch (e) {
			console.error(e);
		}
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags.push(tag);
		}
	}

	let selectedPostSlugs = $derived(
		data.posts.filter((post) => displayPost(post)).map((post) => post.slug)
	);
</script>

<svelte:head>
	<title>Blog | Lucas Ng</title>
</svelte:head>

<BasicSection title="My blog">
	<h2 class="py-4">
		{#if selectedTags.length == 0}
			Select a tag to filter the list!
		{:else if selectedTags.length == 1}
			You have selected 1 tag.
		{:else}
			You have selected {selectedTags.length} tags.
		{/if}
	</h2>
	<div class="flex flex-wrap gap-2">
		{#each data.tags as tag}
			<button
				onclick={(e) => {
					e.stopPropagation();
					toggleTag(tag);
				}}
				class="inline-block rounded-full px-2 py-1 text-xs transition-transform hover:scale-110 {selectedTags.includes(
					tag
				)
					? 'font-bold text-orange-600 ring-2 ring-orange-500'
					: 'text-gray-500 ring-1 ring-gray-400'}"
			>
				{tag}
			</button>
		{/each}
	</div>
	<Accordion.Root value={selectedPostSlugs} class="pt-5 sm:pt-10">
		{#each data.posts as post}
			<Accordion.Item value={post.slug}>
				<Accordion.Content transition={fade}>
					<div class="group my-12 rounded-2xl transition-transform hover:scale-[1.02]">
						<a href="/blog/{post.slug}" class="block">
							<article>
								<div class="flex w-full items-center">
									<div class="grow">
										<div>
											<h2
												class="text-pretty bg-stone-50 text-2xl font-semibold text-orange-600 hover:underline"
											>
												{post.title}
											</h2>
											<h3
												class="text-md mt-2 text-pretty bg-stone-50 !leading-relaxed text-gray-700"
											>
												{post.subtitle}
											</h3>
										</div>
										<div class="mt-4 flex gap-6">
											{#if post.date}
												<div class="flex items-center">
													<p class="ml-1 text-xs text-gray-500">{post.date}</p>
												</div>
											{/if}
											{#if post.tags?.length > 0}
												<div class="flex items-center">
													<img src={labelIcon} class="inline-block h-6 w-6" alt="Label icon" />
													<p class="ml-1 text-xs text-gray-500">{post.tags.join(', ')}</p>
												</div>
											{/if}
										</div>
									</div>
									<img
										src={linkIcon}
										alt="Link Icon"
										class="hidden h-6 w-6 -rotate-45 md:group-hover:block"
									/>
								</div>
							</article>
						</a>
					</div>
				</Accordion.Content>
			</Accordion.Item>
		{/each}
	</Accordion.Root>
</BasicSection>
