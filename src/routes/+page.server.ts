import type { PageServerLoad } from './$types';
import { tabService } from '$lib/server/sources/tab-service';
import { chartService } from '$lib/server/charts/chart-service';
import type { UnifiedSearchResult } from '$lib/server/sources/types';

export const load: PageServerLoad = async ({ url }) => {
	const query = url.searchParams.get('q') || '';
	const type = url.searchParams.get('type') || undefined;

	let initialResults: UnifiedSearchResult[] = [];
	if (query.trim()) {
		initialResults = await tabService.search(query.trim(), type);
	}

	const trendingChart = await chartService.getBillboardHot100(6);

	return {
		query,
		type: type || 'all',
		initialResults,
		trendingChart
	};
};
