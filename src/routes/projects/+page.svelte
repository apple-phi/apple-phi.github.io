<script lang="ts">
	let { data } = $props();
	import type { ProjectItemMetadata } from '$lib/projects';
	import BasicSection from '$lib/components/BasicSection.svelte';

	// Use array so Svelte 5 can make it "deeply reactive"
	let selectedTags = $state([] as string[]);

	function displayProject(project: ProjectItemMetadata) {
		if (!selectedTags.length) return true;
		return selectedTags.every((tag) => project.tags?.includes(tag));
	}

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags.push(tag);
		}
	}
</script>

<BasicSection title="Past projects">
	<ul class="space-y-4 pt-5 sm:space-y-8 sm:pt-10">
		{#each data.items as project (project.slug)}
			<li class="rounded-2xl {displayProject(project) ? '' : 'hidden'}">
				<article>
					<div class="flex items-baseline">
						<div class="w-24 flex-none pr-16 text-right text-gray-500">
							{@html project.date}
						</div>
						<div class="flex-grow">
							<div class="flex items-center">
								<a href="/projects/{project.slug}">
									<h2
										class="inline-block text-pretty bg-stone-50 text-2xl font-semibold text-orange-600 hover:underline"
									>
										{@html project.title}
									</h2>
								</a>
								{#if project.tags?.length > 0}
									<div class="ml-4 inline-flex flex-wrap gap-2">
										{#each project.tags as tag}
											<button
												onclick={() => toggleTag(tag)}
												class="inline-block rounded-full px-2 py-1 text-xs transition-transform hover:scale-110 {selectedTags.includes(
													tag
												)
													? 'border-2 border-orange-500 font-bold text-orange-600'
													: 'border border-gray-300 text-gray-500'}"
											>
												{tag}
											</button>
										{/each}
									</div>
								{/if}
							</div>
							<h3 class="text-md mt-2 text-pretty bg-stone-50 !leading-relaxed text-gray-700">
								{@html project.subtitle}
							</h3>
						</div>
					</div>
				</article>
			</li>
		{/each}
	</ul>
</BasicSection>
