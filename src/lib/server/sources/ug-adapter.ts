import type {
	TabSourceAdapter,
	UnifiedSearchResult,
	UnifiedTabDetail,
	TabVersionInfo,
	ArtistCatalog,
	ArtistTabItem
} from './types';
import { searchCache, tabCache, artistCache } from '../cache';

const USER_AGENT =
	'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export class UGTabAdapter implements TabSourceAdapter {
	readonly sourceId = 'ug';

	/**
	 * Convert external URL/path to clean internal Tabspace ID
	 * e.g. "https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-6125" -> "ug--oasis--wonderwall-chords-6125"
	 */
	static toInternalId(tabUrl: string): string {
		const match = tabUrl.match(/tabs\.ultimate-guitar\.com\/tab\/(.+)$/);
		if (match) {
			const cleanPath = match[1].replace(/^\/+|\/+$/g, '').replace(/\//g, '--');
			return `ug--${cleanPath}`;
		}
		// Fallback for relative paths
		const trimmed = tabUrl.replace(/^tab\//, '').replace(/^\/+|\/+$/g, '').replace(/\//g, '--');
		return `ug--${trimmed}`;
	}

	/**
	 * Convert internal Tabspace ID back to upstream fetch URL
	 */
	static toExternalUrl(internalId: string): string {
		let path = internalId;
		if (path.startsWith('ug--')) {
			path = path.slice(4);
		}
		path = path.replace(/--/g, '/');
		return `https://tabs.ultimate-guitar.com/tab/${path}`;
	}

	private extractStoreData(html: string): any | null {
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
			console.error('Failed to parse store data:', e);
			return null;
		}
	}

	async search(query: string, category?: string): Promise<UnifiedSearchResult[]> {
		const trimmed = query.trim();
		if (!trimmed) return [];

		const cacheKey = `source:${this.sourceId}:search:${trimmed.toLowerCase()}:${category || 'all'}`;
		const cached = searchCache.get<UnifiedSearchResult[]>(cacheKey);
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
			const store = this.extractStoreData(html);
			const rawResults = store?.store?.page?.data?.results || [];

			let results: UnifiedSearchResult[] = rawResults
				.filter((r: any) => {
					if (!r.song_name || !r.tab_url) return false;
					if (r.marketing_type !== undefined) return false;
					const type = (r.type || '').toLowerCase();
					if (type === 'pro' || type === 'official') return false;
					return true;
				})
				.map((r: any) => ({
					id: UGTabAdapter.toInternalId(r.tab_url),
					songName: r.song_name,
					artistName: r.artist_name || 'Unknown Artist',
					type: r.type || 'Chords',
					version: r.version || 1,
					votes: r.votes || 0,
					rating: typeof r.rating === 'number' ? Math.round(r.rating * 10) / 10 : 0,
					difficulty: r.difficulty
				}));

			if (category && category.toLowerCase() !== 'all') {
				const cat = category.toLowerCase();
				results = results.filter((r) => r.type.toLowerCase().includes(cat));
			}

			// Sort by best relevance & popularity
			results.sort((a, b) => {
				const aExact = a.songName.toLowerCase() === trimmed.toLowerCase();
				const bExact = b.songName.toLowerCase() === trimmed.toLowerCase();
				if (aExact && !bExact) return -1;
				if (!aExact && bExact) return 1;

				const scoreA = (a.votes || 0) * (a.rating || 1);
				const scoreB = (b.votes || 0) * (b.rating || 1);
				return scoreB - scoreA;
			});

			searchCache.set(cacheKey, results, 30 * 60 * 1000);
			return results;
		} catch (err) {
			console.error('UGAdapter search error:', err);
			return [];
		}
	}

	async getTab(internalId: string): Promise<UnifiedTabDetail | null> {
		if (!internalId) return null;

		const cacheKey = `source:${this.sourceId}:tab:${internalId}`;
		const cached = tabCache.get<UnifiedTabDetail>(cacheKey);
		if (cached) return cached;

		const externalUrl = UGTabAdapter.toExternalUrl(internalId);

		try {
			const res = await fetch(externalUrl, {
				headers: {
					'User-Agent': USER_AGENT,
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'Accept-Language': 'en-US,en;q=0.9'
				}
			});

			if (!res.ok) {
				console.error(`UGAdapter getTab HTTP error: ${res.status}`);
				return null;
			}

			const html = await res.text();
			const store = this.extractStoreData(html);
			if (!store) return null;

			const pageData = store.store?.page?.data;
			const tabData = pageData?.tab || {};
			const tabView = pageData?.tab_view || {};
			const wikiTab = tabView.wiki_tab || {};

			const content = wikiTab.content || '';
			if (!content) return null;

			// Extract alternative versions if available
			const rawVersions = tabView.versions || [];
			const currentTabId = tabData.id;

			const versions: TabVersionInfo[] = rawVersions
				.filter((v: any) => v.tab_url && v.type_name === tabData.type_name)
				.map((v: any) => ({
					id: UGTabAdapter.toInternalId(v.tab_url),
					version: v.version || 1,
					rating: typeof v.rating === 'number' ? Math.round(v.rating * 10) / 10 : 0,
					votes: v.votes || 0,
					difficulty: v.difficulty,
					tonality: v.tonality_name,
					isCurrent: v.id === currentTabId
				}))
				.sort((a: TabVersionInfo, b: TabVersionInfo) => a.version - b.version);

			// If current tab is not in the versions array, include it
			if (!versions.some((v) => v.isCurrent)) {
				versions.unshift({
					id: internalId,
					version: tabData.version || 1,
					rating: typeof tabData.rating === 'number' ? Math.round(tabData.rating * 10) / 10 : 0,
					votes: tabData.votes || 0,
					difficulty: tabData.difficulty,
					tonality: tabView.meta?.tonality,
					isCurrent: true
				});
			}

			const detail: UnifiedTabDetail = {
				id: internalId,
				songName: tabData.song_name || 'Unknown Song',
				artistName: tabData.artist_name || 'Unknown Artist',
				type: tabData.type_name || 'Chords',
				version: tabData.version || 1,
				versions,
				votes: tabData.votes || 0,
				rating: typeof tabData.rating === 'number' ? Math.round(tabData.rating * 10) / 10 : 0,
				capo: typeof tabView.meta?.capo === 'number' ? tabView.meta.capo : undefined,
				tuning: tabView.meta?.tuning,
				tonality: tabView.meta?.tonality,
				difficulty: tabData.difficulty,
				content,
				applicature: tabView.applicature
			};

			tabCache.set(cacheKey, detail, 24 * 60 * 60 * 1000);
			return detail;
		} catch (err) {
			console.error('UGAdapter getTab error:', err);
			return null;
		}
	}

	/**
	 * Attempt to parse the internal ID to search for an active working version
	 * when an exact tab ID returns 404 (e.g. deleted version, typo, expired link).
	 */
	async findAlternative(internalId: string): Promise<UnifiedSearchResult | null> {
		if (!internalId) return null;

		let clean = internalId.replace(/^[a-z0-9]+--/, '');
		const parts = clean.split('--');
		if (parts.length < 2) return null;

		const artist = parts[0].replace(/-/g, ' ').trim();
		let songRaw = parts.slice(1).join(' ');

		let detectedType: string | undefined = undefined;
		const typeMatch = songRaw.match(
			/-(chords|tabs|bass|ukulele|crd|guitar-pro|power|drum-tabs|pro)(-[0-9]+)?$/i
		);
		if (typeMatch) {
			detectedType = typeMatch[1];
			songRaw = songRaw.replace(typeMatch[0], '');
		} else {
			songRaw = songRaw.replace(/-[0-9]+$/, '');
		}

		const songTitle = songRaw.replace(/-/g, ' ').trim();
		if (!songTitle) return null;

		const query = `${artist} ${songTitle}`.trim();
		const results = await this.search(query, detectedType);
		if (!results || results.length === 0) return null;

		// Find the best match that has content and is not the failed internalId
		for (const candidate of results) {
			if (candidate.id === internalId) continue;
			const songLower = songTitle.toLowerCase();
			const candSongLower = candidate.songName.toLowerCase();
			if (
				candSongLower.includes(songLower) ||
				songLower.includes(candSongLower) ||
				candidate.artistName.toLowerCase().includes(artist.toLowerCase())
			) {
				return candidate;
			}
		}

		return results[0]?.id !== internalId ? results[0] : null;
	}

	/**
	 * Retrieve an artist's full catalog ranked by popularity
	 */
	async getArtistCatalog(
		artistSlugOrName: string,
		category?: string
	): Promise<ArtistCatalog | null> {
		const cleanQuery = artistSlugOrName.trim().replace(/-/g, ' ');
		if (!cleanQuery) return null;

		const cacheKey = `source:${this.sourceId}:artist:${cleanQuery.toLowerCase()}:${category || 'all'}`;
		const cached = artistCache.get<ArtistCatalog>(cacheKey);
		if (cached) return cached;

		try {
			// Step 1: Find the artist's official page URL on UG
			const searchUrl = `https://www.ultimate-guitar.com/search.php?search_type=band&value=${encodeURIComponent(
				cleanQuery
			)}`;
			const sRes = await fetch(searchUrl, {
				headers: {
					'User-Agent': USER_AGENT,
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
				}
			});

			if (!sRes.ok) return null;
			const sHtml = await sRes.text();
			const sStore = this.extractStoreData(sHtml);
			const bandResults = sStore?.store?.page?.data?.results || [];
			if (bandResults.length === 0) return null;

			// Find closest matching artist
			let targetBand = bandResults.find(
				(b: any) => b.artist_name.toLowerCase() === cleanQuery.toLowerCase()
			) || bandResults[0];

			if (!targetBand || !targetBand.artist_url) return null;

			// Step 2: Fetch the artist's catalog sorted by hits (popularity)
			const artistPageUrl = `https://www.ultimate-guitar.com${targetBand.artist_url}?sort=hits`;
			const aRes = await fetch(artistPageUrl, {
				headers: {
					'User-Agent': USER_AGENT,
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
				}
			});

			if (!aRes.ok) return null;
			const aHtml = await aRes.text();
			const aStore = this.extractStoreData(aHtml);
			const pageData = aStore?.store?.page?.data || {};
			const rawTabs = pageData.other_tabs || [];

			let validTabs: ArtistTabItem[] = rawTabs
				.filter((t: any) => {
					if (!t.tab_url || !t.song_name) return false;
					if (t.tab_url.includes('/pro/') || t.type_name === 'Official') return false;
					return true;
				})
				.map((t: any) => ({
					id: UGTabAdapter.toInternalId(t.tab_url),
					songName: t.song_name,
					artistName: targetBand.artist_name,
					type: t.type_name || 'Chords',
					version: t.version || 1,
					votes: t.votes || 0,
					rating: typeof t.rating === 'number' ? Math.round(t.rating * 10) / 10 : 0,
					difficulty: t.difficulty
				}));

			if (category && category.toLowerCase() !== 'all') {
				const cat = category.toLowerCase();
				validTabs = validTabs.filter((t) => t.type.toLowerCase().includes(cat));
			}

			// Sort tabs by popularity: votes * rating descending
			validTabs.sort((a, b) => {
				const scoreA = (a.votes || 0) * (a.rating || 1);
				const scoreB = (b.votes || 0) * (b.rating || 1);
				return scoreB - scoreA;
			});

			const slug = targetBand.artist_name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');

			const catalog: ArtistCatalog = {
				artist: {
					name: targetBand.artist_name,
					slug,
					tabsCount: targetBand.tabs_cnt || validTabs.length,
					country: pageData.artist?.country_code
				},
				tabs: validTabs
			};

			artistCache.set(cacheKey, catalog, 24 * 60 * 60 * 1000); // 24 hours
			return catalog;
		} catch (err) {
			console.error('UGAdapter getArtistCatalog error:', err);
			return null;
		}
	}
}
