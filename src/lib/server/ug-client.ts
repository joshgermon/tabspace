import { searchCache, tabCache } from './cache';

export interface TabSearchResult {
	id: number;
	song_name: string;
	artist_name: string;
	type: string; // 'Chords', 'Tab', 'Bass', 'Ukulele'
	version: number;
	votes: number;
	rating: number;
	tab_url: string;
	artist_url?: string;
	difficulty?: string;
}

export interface TabDetail {
	id: number;
	song_name: string;
	artist_name: string;
	type_name: string;
	version: number;
	votes: number;
	rating: number;
	tab_url: string;
	capo?: number;
	tuning?: { name: string; value: string; index?: number };
	tonality?: string;
	difficulty?: string;
	content: string;
	applicature?: Record<string, any[]>;
}

const USER_AGENT =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

/**
 * Extracts and parses JSON from the embedded js-store div in UG HTML
 */
function extractStoreData(html: string): any | null {
	const match = html.match(/class="js-store"[^>]*data-content="([^"]+)"/);
	if (!match) return null;

	try {
		const jsonStr = match[1]
			.replace(/&quot;/g, '"')
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>');
		return JSON.parse(jsonStr);
	} catch (e) {
		console.error('Failed to parse js-store data-content:', e);
		return null;
	}
}

/**
 * Searches Ultimate Guitar for songs, chords, and tabs
 */
export async function searchUG(
	query: string,
	categoryFilter?: string
): Promise<TabSearchResult[]> {
	const trimmed = query.trim();
	if (!trimmed) return [];

	const cacheKey = `search:${trimmed.toLowerCase()}:${categoryFilter || 'all'}`;
	const cached = searchCache.get<TabSearchResult[]>(cacheKey);
	if (cached) return cached;

	const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(
		trimmed
	)}`;

	try {
		const res = await fetch(searchUrl, {
			headers: {
				'User-Agent': USER_AGENT,
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9'
			}
		});

		if (!res.ok) {
			console.error(`UG Search HTTP error: ${res.status}`);
			return [];
		}

		const html = await res.text();
		const store = extractStoreData(html);
		const rawResults = store?.store?.page?.data?.results || [];

		// Filter out marketing, pro items, official tabs without wiki content
		let results: TabSearchResult[] = rawResults
			.filter((r: any) => {
				if (!r.song_name || !r.tab_url) return false;
				if (r.marketing_type !== undefined) return false;
				const type = (r.type || '').toLowerCase();
				if (type === 'pro' || type === 'official') return false;
				return true;
			})
			.map((r: any) => ({
				id: r.id || 0,
				song_name: r.song_name,
				artist_name: r.artist_name || 'Unknown Artist',
				type: r.type || 'Chords',
				version: r.version || 1,
				votes: r.votes || 0,
				rating: typeof r.rating === 'number' ? Math.round(r.rating * 10) / 10 : 0,
				tab_url: r.tab_url,
				artist_url: r.artist_url,
				difficulty: r.difficulty
			}));

		// Apply category filter if given
		if (categoryFilter && categoryFilter.toLowerCase() !== 'all') {
			const cat = categoryFilter.toLowerCase();
			results = results.filter((r) => r.type.toLowerCase().includes(cat));
		}

		// Sort by votes/rating descending for best match quality
		results.sort((a, b) => {
			// Prioritize exact or prefix title matches
			const aExact = a.song_name.toLowerCase() === trimmed.toLowerCase();
			const bExact = b.song_name.toLowerCase() === trimmed.toLowerCase();
			if (aExact && !bExact) return -1;
			if (!aExact && bExact) return 1;

			// Then sort by popularity (votes * rating)
			const scoreA = (a.votes || 0) * (a.rating || 1);
			const scoreB = (b.votes || 0) * (b.rating || 1);
			return scoreB - scoreA;
		});

		// Cache for 30 minutes
		searchCache.set(cacheKey, results, 30 * 60 * 1000);
		return results;
	} catch (err) {
		console.error('Error fetching search results from UG:', err);
		return [];
	}
}

/**
 * Fetches full tab details from Ultimate Guitar tab URL
 */
export async function getUGTab(tabUrl: string): Promise<TabDetail | null> {
	if (!tabUrl) return null;

	const cacheKey = `tab:${tabUrl}`;
	const cached = tabCache.get<TabDetail>(cacheKey);
	if (cached) return cached;

	try {
		const res = await fetch(tabUrl, {
			headers: {
				'User-Agent': USER_AGENT,
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9'
			}
		});

		if (!res.ok) {
			console.error(`UG Tab HTTP error: ${res.status}`);
			return null;
		}

		const html = await res.text();
		const store = extractStoreData(html);
		if (!store) return null;

		const pageData = store.store?.page?.data;
		const tabData = pageData?.tab || {};
		const tabView = pageData?.tab_view || {};
		const wikiTab = tabView.wiki_tab || {};

		const content = wikiTab.content || '';
		if (!content) return null;

		const detail: TabDetail = {
			id: tabData.id || 0,
			song_name: tabData.song_name || 'Unknown Song',
			artist_name: tabData.artist_name || 'Unknown Artist',
			type_name: tabData.type_name || 'Chords',
			version: tabData.version || 1,
			votes: tabData.votes || 0,
			rating: typeof tabData.rating === 'number' ? Math.round(tabData.rating * 10) / 10 : 0,
			tab_url: tabUrl,
			capo: typeof tabView.meta?.capo === 'number' ? tabView.meta.capo : undefined,
			tuning: tabView.meta?.tuning,
			tonality: tabView.meta?.tonality,
			difficulty: tabData.difficulty,
			content,
			applicature: tabView.applicature
		};

		// Cache for 24 hours
		tabCache.set(cacheKey, detail, 24 * 60 * 60 * 1000);
		return detail;
	} catch (err) {
		console.error('Error fetching tab from UG:', err);
		return null;
	}
}
