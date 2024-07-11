import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import type { ProjectItemMetadata } from '$lib/projects';

export const load = async ({ params }) => {
	try {
		const item = await import(`$lib/projects/items/${params.item}.md`);
		return {
			ProjectContent: item.default as Component,
			meta: { ...item.metadata, slug: params.item } as ProjectItemMetadata
		};
	} catch (err) {
		error(404, err as Error);
	}
};
