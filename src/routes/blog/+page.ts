import type { BlogPostMetadata } from '$lib/blog/index.js';

export const prerender = true;

export const load = async ({ url, fetch }) => {
	const postRes = await fetch(`${url.origin}/api/posts.json`);
	const posts: BlogPostMetadata[] = await postRes.json();

	const totalRes = await fetch(`${url.origin}/api/posts/count`);
	const total: number = await totalRes.json();

	return { posts, total };
};
