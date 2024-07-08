<script>
	export let data;
	import BgGridEffect from '$lib/components/BgGridEffect.svelte';
</script>

<svelte:head>
	<title>Blog</title>
</svelte:head>

<BgGridEffect />

<section class="p-40">
	<div class="mx-auto max-w-3xl space-y-12">
		<div class="text-left">
			<h1
				class="font-display text-4xl underline decoration-orange-500 decoration-wavy underline-offset-8"
			>
				My blog
			</h1>
		</div>

		<ul class="space-y-8">
			{#each data.posts as post}
				<li class="rounded-2xl bg-white p-6 shadow-lg transition-transform hover:scale-105">
					<article>
						<a href="/blog/{post.slug}" class="block">
							<h2 class="text-2xl font-semibold text-orange-600 hover:underline">
								{post.title}
							</h2>
						</a>
						<p class="text-md mt-4 !leading-relaxed text-gray-700">
							{post.excerpt}
						</p>
					</article>
				</li>
			{/each}
		</ul>
	</div>
</section>
