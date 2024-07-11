<script>
	export let data;
	import BasicSection from '$lib/components/BasicSection.svelte';
	import { labelIcon } from '$lib/svg';
</script>

<svelte:head>
	<title>Projects | Lucas Ng</title>
</svelte:head>

<BasicSection title="My projects">
	<ul class="space-y-4 pt-5 sm:space-y-8 sm:pt-10">
		{#each data.items as project}
			<li class="rounded-2xl transition-transform hover:scale-[1.02]">
				<a href="/projects/{project.slug}" class="block">
					<article>
						<h2
							class="inline-block text-pretty bg-stone-50 text-2xl font-semibold text-orange-600 hover:underline"
						>
							{project.title}
						</h2>
						<h3
							class="text-md mt-2 inline-block text-pretty bg-stone-50 !leading-relaxed text-gray-700"
						>
							{project.subtitle}
						</h3>
						<div class="mt-6 flex gap-6">
							{#if project.tags?.length > 0}
								<div class="flex items-center">
									<img src={labelIcon} class="inline-block h-6 w-6" alt="Tag icon" />
									<p class="ml-1 text-xs text-gray-500">{project.tags.join(', ')}</p>
								</div>
							{/if}
						</div>
					</article>
				</a>
			</li>
		{/each}
	</ul>
</BasicSection>
