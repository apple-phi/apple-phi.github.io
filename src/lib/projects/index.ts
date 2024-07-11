import { fetchItems } from '$lib';

export interface ProjectItemMetadata {
	title: string;
	subtitle: string;
	date: string;
	tags: string[];
}

export const fetchProjects = async () =>
	fetchItems<ProjectItemMetadata>({ files: import.meta.glob('/src/lib/projects/items/*.md') });
