import type { ProjectItemMetadata } from '$lib/projects/index.js';

export const prerender = true;

// Can't use `fetchProjects` directly
// because load functions can only return POJOs
export const load = async ({ url, fetch }) => {
	const res = await fetch(`${url.origin}/projects/items.json`);
	const items: (ProjectItemMetadata & { slug?: string })[] = await res.json();

	return { items };
};
