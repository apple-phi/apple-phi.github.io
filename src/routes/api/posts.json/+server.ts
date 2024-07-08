import { fetchPosts } from '$lib/blog';
import { json } from '@sveltejs/kit';
import type { BlogPostMetadata } from '$lib/blog';

export const prerender = true;

export const GET = async () => {
	const posts: BlogPostMetadata[] = await fetchPosts();
	return json(posts);
};
