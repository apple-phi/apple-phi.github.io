<script>
	export let data;
	import BgGridEffect from '$lib/components/BgGridEffect.svelte';
	import { calendarIcon, labelIcon } from '$lib/svg';
</script>

<svelte:head>
	<title>Blog | Lucas Ng</title>
</svelte:head>

<BgGridEffect />

<section class="sm:pt-30 relative flex min-h-screen p-7 pt-20 md:pt-40">
	<div class="mx-auto space-y-12 sm:w-3/4 lg:w-1/2">
		<div class="text-left">
			<h1
				class="font-display text-3xl underline decoration-orange-500 decoration-wavy underline-offset-8 sm:text-4xl"
			>
				My blog
			</h1>
		</div>

		<ul class="space-y-8 pt-5 sm:pt-10">
			{#each data.posts as post}
				<li class=" rounded-2xl transition-transform hover:scale-[1.02]">
					<a href="/blog/{post.slug}" class="block">
						<article>
							<h2
								class="inline-block text-pretty bg-slate-50 text-2xl font-semibold text-orange-600 hover:underline"
							>
								{post.title}
							</h2>
							<h3
								class="text-md mt-2 inline-block text-pretty bg-slate-50 !leading-relaxed text-gray-700"
							>
								{post.subtitle}
							</h3>
							<div class="mt-6 flex gap-6">
								{#if post.date}
									<div class="flex items-center">
										<img src={calendarIcon} class="inline-block h-6 w-6" alt="Calendar icon" />
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
						</article>
					</a>
				</li>
			{/each}
		</ul>
	</div>
</section>
