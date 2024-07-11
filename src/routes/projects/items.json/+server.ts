import { fetchProjects } from '$lib/projects';
import { json } from '@sveltejs/kit';

export const prerender = true;

export const GET = async () => {
	const posts = await fetchProjects();
	return json(posts);
};
