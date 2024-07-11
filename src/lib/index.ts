import type { ImportGlobFunction } from 'vite';

interface MinMetadata {
	tags: string[];
	date: string;
}

// Return type of `import.meta.glob`
type importMetaGlob = ReturnType<ImportGlobFunction>;

// Modified from `fetchPath`
// at https://github.com/josh-collinsworth/sveltekit-blog-starter
// To remove pagination, be type-safe and generic
export async function fetchItems<T extends MinMetadata>({
	files,
	tag = ''
}: {
	files: importMetaGlob;
	tag?: string;
}): Promise<Awaited<T & { slug?: string }>[]> {
	const items = await Promise.all(
		Object.entries(files).map(async ([path, resolver]) => {
			// @ts-ignore
			const { metadata } = (await resolver()) as { metadata: T };
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
