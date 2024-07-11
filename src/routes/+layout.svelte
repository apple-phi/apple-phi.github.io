<script>
	import '../app.css';
	import { navItems } from '$lib/config';
</script>

<main class="flex min-h-screen flex-col justify-between bg-stone-50">
	<section class="absolute top-0 z-20 w-screen">
		<nav class="flex w-screen items-stretch px-5 py-6 sm:px-8">
			<div class="whitespace-nowrap">
				<a href="/"><h1 class="text-md font-display text-orange-700">Lucas Ng</h1></a>
			</div>
			<ul class="container flex justify-end gap-3 pr-3 sm:gap-6 sm:pr-6 md:gap-12">
				{#each navItems as { title, href }}
					<li>
						<a
							{href}
							class="sm:text-md bg-stone-50 p-1 text-sm text-stone-500 hover:opacity-80 focus:opacity-50"
							>{title}</a
						>
					</li>
				{/each}
			</ul>
		</nav>
	</section>
	<section class="flex grow">
		<slot></slot>
	</section>
	<section class="z-20 w-screen">
		<footer class="flex justify-center">
			<div class="bg-stone-50 p-1 text-sm sm:p-2">
				<p class="text-xs text-stone-500 opacity-80 md:text-sm">
					Lucas Ng &copy; 2024 | See the code for my site
					<a
						href="https://github.com/apple-phi/apple-phi.github.io"
						target="_blank"
						rel="noopener noreferrer"
					>
						<span class="underline hover:opacity-70 focus:opacity-50">here</span>
					</a>
				</p>
			</div>
		</footer>
	</section>
</main>
