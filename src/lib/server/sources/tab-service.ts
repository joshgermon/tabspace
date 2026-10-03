import type {
	TabSourceAdapter,
	UnifiedSearchResult,
	UnifiedTabDetail,
	ArtistCatalog
} from './types';
import { UGTabAdapter } from './ug-adapter';

export class TabService {
	private adapters = new Map<string, TabSourceAdapter>();
	private defaultAdapterId = 'ug';

	constructor() {
		// Register default UG adapter
		this.registerAdapter(new UGTabAdapter());
	}

	registerAdapter(adapter: TabSourceAdapter): void {
		this.adapters.set(adapter.sourceId, adapter);
	}

	getAdapter(sourceId: string): TabSourceAdapter | undefined {
		return this.adapters.get(sourceId);
	}

	/**
	 * Search across available tab sources
	 */
	async search(query: string, category?: string): Promise<UnifiedSearchResult[]> {
		const adapter = this.adapters.get(this.defaultAdapterId);
		if (!adapter) return [];

		return adapter.search(query, category);
	}

	/**
	 * Resolve tab details by internal Tabspace ID
	 */
	async getTab(internalId: string): Promise<UnifiedTabDetail | null> {
		if (!internalId) return null;

		// Clean up leading/trailing slashes
		const cleanId = internalId.replace(/^\/+|\/+$/g, '');

		// Determine which adapter to use based on ID prefix
		let sourceId = this.defaultAdapterId;
		if (cleanId.includes('--')) {
			const prefix = cleanId.split('--')[0];
			if (this.adapters.has(prefix)) {
				sourceId = prefix;
			}
		}

		const adapter = this.adapters.get(sourceId);
		if (!adapter) return null;

		return adapter.getTab(cleanId);
	}

	/**
	 * Find an alternative working tab if an internal ID fails
	 */
	async findAlternative(internalId: string): Promise<UnifiedSearchResult | null> {
		if (!internalId) return null;

		const cleanId = internalId.replace(/^\/+|\/+$/g, '');
		let sourceId = this.defaultAdapterId;
		if (cleanId.includes('--')) {
			const prefix = cleanId.split('--')[0];
			if (this.adapters.has(prefix)) {
				sourceId = prefix;
			}
		}

		const adapter = this.adapters.get(sourceId);
		if (!adapter || !adapter.findAlternative) return null;

		return adapter.findAlternative(cleanId);
	}

	/**
	 * Retrieve an artist catalog ranked by popularity
	 */
	async getArtistCatalog(
		artistSlugOrName: string,
		category?: string
	): Promise<ArtistCatalog | null> {
		const adapter = this.adapters.get(this.defaultAdapterId);
		if (!adapter || !adapter.getArtistCatalog) return null;

		return adapter.getArtistCatalog(artistSlugOrName, category);
	}
}

export const tabService = new TabService();
