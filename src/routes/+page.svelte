<script lang="ts">
	import Anim from './HeroAnimation.svelte';

	import peepEyesOpen from '$lib/svg/peep-eyes-open.svg';
	import peepEyesClosed from '$lib/svg/peep-eyes-closed.svg';
	import githubIcon from '$lib/svg/github.svg';
	import linkedinIcon from '$lib/svg/linkedin.svg';
</script>

<div class="relative flex h-screen bg-stone-50">
	<Anim />
	<div class="z-10 m-auto rounded-2xl bg-inherit px-10 !pb-0 pt-14">
		<div class="group sm:flex sm:flex-row-reverse">
			<img src={peepEyesClosed} class="w-1/2 group-has-[:hover]:hidden" alt="A cartoon of Lucas" />
			<img
				src={peepEyesOpen}
				class="hidden w-1/2 group-has-[:hover]:block"
				alt="A cartoon of Lucas"
			/>
			<div class="h-min space-y-12">
				<h1
					class="font-display text-4xl underline decoration-orange-500 decoration-wavy underline-offset-8"
				>
					Hiya, I'm Lucas
				</h1>
				<p class="text-md max-w-96 !leading-relaxed">
					I'm a student of Information and Computer Engineering at the University of Cambridge. I
					love technology, interior design, and being outdoors.
				</p>
				<div class="flex gap-2">
					<a href="https://github.com/apple-phi" target="_blank" rel="noopener noreferrer">
						<img src={githubIcon} class="inline-block h-6 w-6" alt="GitHub icon" />
					</a>
					<a href="https://linkedin.com/in/lucas-ng123" target="_blank" rel="noopener noreferrer">
						<img src={linkedinIcon} class="inline-block h-6 w-6" alt="LinkedIn icon" />
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
