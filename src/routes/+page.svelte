<script lang="ts">
	import { peepEyesClosed, peepEyesOpen } from '$lib/svg';
	import { socialLinks } from '$lib/config';
	import BgGridEffect from '$lib/components/BgGridEffect.svelte';
</script>

<svelte:head>
	<title>Lucas Ng</title>
</svelte:head>

<BgGridEffect />

<section class="relative flex h-screen">
	<div class="m-auto rounded-2xl px-10 !pb-0 pt-5 sm:pt-14">
		<div class="group sm:flex sm:flex-row-reverse">
			<img src={peepEyesClosed} class="w-1/2 group-has-[:hover]:hidden" alt="A cartoon of Lucas" />
			<img
				src={peepEyesOpen}
				class="hidden w-1/2 group-has-[:hover]:block"
				alt="A cartoon of Lucas"
			/>
			<div class="space-y-4 sm:space-y-8">
				<div class="pb-4">
					<h1
						class="whitespace-nowrap font-display text-3xl underline decoration-orange-500 decoration-wavy underline-offset-8 sm:text-4xl"
					>
						Hiya, I'm Lucas
					</h1>
				</div>
				<div class="sm:text-md space-y-4 rounded-xl text-sm md:text-lg">
					<p
						class="w-fit max-w-80 rounded-md bg-stone-50 px-2 !leading-relaxed md:max-w-96 lg:max-w-[28rem]"
					>
						I'm a student of Information and Computer Engineering at the University of Cambridge. I
						love technology, interior design, and being outdoors.
					</p>
					<p class="inline-block bg-stone-50">
						I occasionally write on my <a href="/blog" class="underline">blog</a>.
					</p>
				</div>
				<div class="flex gap-3">
					{#each socialLinks as { name, href, icon }}
						<a {href} target="_blank" rel="noopener noreferrer">
							<img src={icon} class="inline-block h-6 w-6" alt="{name} icon" />
						</a>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>
