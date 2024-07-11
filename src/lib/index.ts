import type { ImportGlobFunction } from 'vite';
import type { Component } from 'svelte';

interface MinMetadata {
	tags: string[];
	date: string;
}

// Modified from `fetchPath`
// at https://github.com/josh-collinsworth/sveltekit-blog-starter
// To remove pagination, be type-safe and generic
export async function fetchItems<T extends MinMetadata>({
	files,
	tag = ''
}: {
	files: ReturnType<ImportGlobFunction>;
	tag?: string;
}): Promise<Awaited<T & { slug?: string }>[]> {
	const items = await Promise.all(
		Object.entries(files).map(async ([path, resolver]) => {
			// @ts-ignore
			const { metadata } = (await resolver()) as { metadata: T; default: Component };
			const slug = path.split('/').pop()?.slice(0, -3);
			return { ...metadata, slug };
		})
	);
	let sortedItems = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	if (tag) {
		sortedItems = sortedItems.filter((item) => item.tags.includes(tag));
	}
	return sortedItems;
}
