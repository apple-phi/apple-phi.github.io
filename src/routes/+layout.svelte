<script>
	import '../app.css';
	import { navItems } from '$lib/config';
</script>

<main class="bg-stone-50">
	<slot></slot>
	<section class="absolute top-0 w-screen">
		<nav class="flex w-screen items-stretch px-5 py-6 sm:px-8">
			<div class="whitespace-nowrap">
				<a href="/"><h1 class="text-md font-display text-orange-700">lucas.diy</h1></a>
			</div>
			<ul class="container flex justify-end gap-4 pr-0 sm:gap-8 sm:pr-2 md:gap-12">
				{#each navItems as { title, href }}
					<li>
						<a
							{href}
							class="bg-slate-50 p-1 text-xs text-stone-500 hover:opacity-80 focus:opacity-50 sm:text-sm"
							>{title}</a
						>
					</li>
				{/each}
			</ul>
		</nav>
	</section>
	<section class="sticky bottom-0 w-screen sm:absolute">
		<footer class="flex justify-center">
			<div class="bg-stone-50 p-2 text-sm">
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
