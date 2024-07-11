import { fetchItems } from '$lib';

export interface BlogPostMetadata {
	title: string;
	subtitle: string;
	date: string;
	tags: string[];
}

export const fetchPosts = async () =>
	fetchItems<BlogPostMetadata>({ files: import.meta.glob('/src/lib/blog/posts/*.md') });
