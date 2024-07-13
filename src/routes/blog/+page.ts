import type { BlogPostMetadata } from '$lib/blog';

export const prerender = true;

// Can't use `fetchPosts` directly
// because load functions can only return POJOs
export const load = async ({ url, fetch }) => {
	const postRes = await fetch(`${url.origin}/blog/posts.json`);
	const posts: (BlogPostMetadata & { slug: string })[] = await postRes.json();

	const tags = new Set<string>();
	posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));

	return { url, posts, tags: Array.from(tags).sort() };
};
