<script lang="ts">
	import { Collapsible } from 'bits-ui';
	import { fade } from 'svelte/transition';
	let { data } = $props();
	import type { ProjectItemMetadata } from '$lib/projects';
	import BasicSection from '$lib/components/BasicSection.svelte';
	import linkIcon from '$lib/svg/link-iconoir.svg';
	import { onMount } from 'svelte';

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

	function displayProject(project: ProjectItemMetadata) {
		if (!selectedTags.length) return true;
		return selectedTags.every((tag) => project.tags?.includes(tag));
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
</script>

<BasicSection title="Past projects">
	<h2 class="py-4">
		{#if selectedTags.length == 0}
			Select a tag to filter the list!
		{:else if selectedTags.length == 1}
			You have selected 1 tag.
		{:else}
			You have selected {selectedTags.length} tags.
		{/if}
	</h2>
	<ul class="w-auto pt-5 sm:pt-10">
		{#each data.items as project (project.slug)}
			<Collapsible.Root open={displayProject(project)}>
				<Collapsible.Content transition={fade}>
					<li class="group rounded-2xl py-4">
						<article class="flex items-baseline group-hover:items-center">
							<div
								class="relative hidden w-12 flex-none pr-16 text-right text-gray-500 sm:block md:w-24"
							>
								<span class="group-hover:hidden">{new Date(project.date).getFullYear()}</span>
								<a href="/projects/{project.slug}" class="hidden group-hover:inline-block">
									<img src={linkIcon} alt="Link Icon" class="h-6 w-6" />
								</a>
							</div>
							<div class="flex-grow">
								<div class="w-full items-center gap-4 lg:flex">
									<a href="/projects/{project.slug}">
										<div class="flex items-baseline">
											<h2
												class="whitespace-nowrap bg-stone-50 py-1 text-2xl font-semibold text-orange-600 group-hover:underline"
											>
												{project.title}
											</h2>
											<p class="pl-4 text-gray-500 sm:hidden">
												{new Date(project.date).getFullYear()}
											</p>
										</div>
									</a>

									{#if project.tags?.length > 0}
										<div class="flex flex-wrap gap-2">
											{#each project.tags as tag}
												<button
													onclick={(e) => {
														e.stopPropagation();
														toggleTag(tag);
													}}
													class="inline-block rounded-full px-2 py-1 text-xs transition-transform hover:scale-110 {selectedTags.includes(
														tag
													)
														? 'border-2 border-orange-500 font-bold text-orange-600'
														: 'border border-gray-400 text-gray-500'}"
												>
													{tag}
												</button>
											{/each}
										</div>
									{/if}
									<!-- Make the empty space clickable also (bit hacky) -->
									<div class="h-full grow">
										<a href="/projects/{project.slug}"><div class="size-full">&nbsp;</div></a>
									</div>
								</div>
								<a href="/projects/{project.slug}">
									<h3 class="text-md text-pretty bg-stone-50 pt-3 !leading-relaxed text-gray-700">
										{@html project.subtitle}
									</h3>
								</a>
							</div>
						</article>
					</li>
				</Collapsible.Content>
			</Collapsible.Root>
		{/each}
	</ul>
</BasicSection>
