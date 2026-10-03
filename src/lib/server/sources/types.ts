// Domain interfaces for Tabspace multi-source architecture

export type TabCategory = 'all' | 'chords' | 'tab' | 'bass' | 'ukulele';

export interface UnifiedSearchResult {
	id: string; // Internal Tabspace ID (e.g. "ug--oasis--wonderwall-chords-6125")
	songName: string;
	artistName: string;
	type: string; // 'Chords', 'Tab', 'Bass', 'Ukulele'
	version: number;
	votes: number;
	rating: number;
	difficulty?: string;
}

export interface TabVersionInfo {
	id: string; // Internal Tabspace ID for this version
	version: number;
	rating: number;
	votes: number;
	difficulty?: string;
	tonality?: string;
	isCurrent?: boolean;
}

export interface UnifiedTabDetail {
	id: string; // Internal Tabspace ID
	songName: string;
	artistName: string;
	type: string;
	version: number;
	versions: TabVersionInfo[];
	votes: number;
	rating: number;
	capo?: number;
	tuning?: { name: string; value: string; index?: number };
	tonality?: string;
	difficulty?: string;
	content: string;
	applicature?: Record<string, any[]>;
}

export interface ArtistInfo {
	name: string;
	slug: string;
	tabsCount: number;
	country?: string;
	bio?: string;
}

export interface ArtistTabItem {
	id: string; // Internal Tabspace ID (e.g. "ug--oasis--wonderwall-chords-6125")
	songName: string;
	artistName: string;
	type: string; // 'Chords', 'Tab', 'Bass', 'Ukulele'
	version: number;
	votes: number;
	rating: number;
	difficulty?: string;
}

export interface ArtistCatalog {
	artist: ArtistInfo;
	tabs: ArtistTabItem[];
}

export interface TabSourceAdapter {
	readonly sourceId: string;
	search(query: string, category?: string): Promise<UnifiedSearchResult[]>;
	getTab(internalId: string): Promise<UnifiedTabDetail | null>;
	findAlternative?(internalId: string): Promise<UnifiedSearchResult | null>;
	getArtistCatalog?(artistSlugOrName: string, category?: string): Promise<ArtistCatalog | null>;
}
