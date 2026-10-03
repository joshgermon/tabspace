import type { PageServerLoad } from './$types';
import { tabService } from '$lib/server/sources/tab-service';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
	const slug = params.slug;
	if (!slug) {
		throw error(400, 'Missing artist slug');
	}

	const category = url.searchParams.get('type') || undefined;
	const catalog = await tabService.getArtistCatalog(slug, category);

	if (!catalog || catalog.tabs.length === 0) {
		const friendlyName = decodeURIComponent(slug).replace(/[-_]+/g, ' ');
		throw error(404, `No guitar tabs or chords found for "${friendlyName}".`);
	}

	return {
		catalog,
		currentCategory: category || 'all'
	};
};
