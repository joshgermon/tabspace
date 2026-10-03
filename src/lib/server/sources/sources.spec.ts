import { describe, it, expect } from 'vitest';
import { UGTabAdapter } from './ug-adapter';
import { TabService } from './tab-service';
import type { TabSourceAdapter, UnifiedSearchResult, UnifiedTabDetail } from './types';

describe('multi-source adapters & ID mapping', () => {
	it('converts external URLs to clean internal IDs without external domain', () => {
		const externalUrl = 'https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-6125';
		const internalId = UGTabAdapter.toInternalId(externalUrl);

		expect(internalId).toBe('ug--oasis--wonderwall-chords-6125');
		expect(internalId).not.toContain('ultimate-guitar.com');
		expect(internalId).not.toContain('http');
	});

	it('converts internal ID back to upstream fetch URL accurately', () => {
		const internalId = 'ug--oasis--wonderwall-chords-6125';
		const externalUrl = UGTabAdapter.toExternalUrl(internalId);

		expect(externalUrl).toBe('https://tabs.ultimate-guitar.com/tab/oasis/wonderwall-chords-6125');
	});

	it('supports registering multiple adapters with clean seams', async () => {
		const service = new TabService();

		// Create a mock alternative source adapter (e.g. community / local)
		const mockAdapter: TabSourceAdapter = {
			sourceId: 'mock',
			async search(q) {
				return [
					{
						id: 'mock--custom-song-1',
						songName: 'Custom Song',
						artistName: 'Indie Artist',
						type: 'Chords',
						version: 1,
						votes: 10,
						rating: 5.0
					}
				];
			},
			async getTab(id) {
				return {
					id,
					songName: 'Custom Song',
					artistName: 'Indie Artist',
					type: 'Chords',
					version: 1,
					versions: [{ id, version: 1, rating: 5, votes: 10, isCurrent: true }],
					votes: 10,
					rating: 5,
					content: '[ch]C[/ch] [ch]G[/ch]\nHello world'
				};
			}
		};

		service.registerAdapter(mockAdapter);
		expect(service.getAdapter('mock')).toBeDefined();

		const result = await service.getTab('mock--custom-song-1');
		expect(result).not.toBeNull();
		expect(result?.songName).toBe('Custom Song');
		expect(result?.id).toBe('mock--custom-song-1');
	});

	it('findAlternative resolves outdated or mistyped tab IDs to canonical matches', async () => {
		const adapter = new UGTabAdapter();
		// Test parsing and resolution on the known Vance Joy typo ID
		const alternative = await adapter.findAlternative('ug--vance-joy--riptide-chords-1239339');
		expect(alternative).not.toBeNull();
		expect(alternative?.songName.toLowerCase()).toContain('riptide');
		expect(alternative?.artistName.toLowerCase()).toContain('vance joy');
		expect(alternative?.id).toContain('ug--vance-joy--riptide');
	});
});
