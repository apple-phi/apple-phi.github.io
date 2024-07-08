<script>
	export let data;

	const { title, excerpt, date, categories } = data.meta;
	const { PostContent } = data;
</script>

<svelte:head>
	<title>{title}</title>
	<meta data-key="description" name="description" content={excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta name="twitter:title" content={title} />
	<meta property="og:description" content={excerpt} />
	<meta name="twitter:description" content={excerpt} />
</svelte:head>

<article class="post">
	<h1>{title}</h1>

	<div class="meta">
		<b>Published:</b>
		{date}
	</div>

	<svelte:component this={PostContent} />

	{#if categories}
		<aside class="post-footer">
			<h2>Posted in:</h2>
			<ul class="post-footer__categories">
				{#each categories as category}
					<li>
						<!-- <a href="/blog/category/{category}/">
							{category}
						</a> -->
					</li>
				{/each}
			</ul>
		</aside>
	{/if}
</article>
