export interface BlogPostMetadata {
	title: string;
	slug: string | undefined;
	excerpt: string;
	date: string;
	categories: string[];
}

export interface BlogPost {
	metadata: BlogPostMetadata;
}

// Modified from https://github.com/josh-collinsworth/sveltekit-blog-starter
// To remove pagination and be type-safe
export const fetchPosts = async ({ category = '' } = {}): Promise<BlogPostMetadata[]> => {
	const posts = await Promise.all(
		Object.entries(import.meta.glob('/src/lib/blog/posts/*.md')).map(async ([path, resolver]) => {
			const { metadata } = (await resolver()) as BlogPost;
			const slug = path.split('/').pop()?.slice(0, -3);
			return { ...metadata, slug };
		})
	);
	let sortedPosts = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	if (category) {
		sortedPosts = sortedPosts.filter((post) => post.categories.includes(category));
	}
	sortedPosts = sortedPosts.map((post) => ({
		title: post.title,
		slug: post.slug,
		excerpt: post.excerpt,
		date: post.date,
		categories: post.categories
	}));
	return sortedPosts;
};
