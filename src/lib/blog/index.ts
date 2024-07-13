import { fetchItems } from '$lib';

export interface BlogPostBase {
	title: string;
	subtitle: string;
	date: string;
	tags: string[];
	hidden?: boolean;
}

export interface BlogPostMetadata extends BlogPostBase {
	slug: string;
}

export const fetchPosts: () => Promise<BlogPostMetadata[]> = async () =>
	fetchItems<BlogPostBase>({ files: import.meta.glob('/src/lib/blog/posts/*.md') });
