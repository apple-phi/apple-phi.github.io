import { error } from '@sveltejs/kit';
import type { Component } from 'svelte';
import type { BlogPostMetadata } from '$lib/blog';

export const load = async ({ params }) => {
	try {
		const post = await import(`$lib/blog/posts/${params.post}.md`);
		return {
			PostContent: post.default as Component,
			meta: { ...post.metadata, slug: params.post } as BlogPostMetadata
		};
	} catch (err) {
		error(404, err as Error);
	}
};
