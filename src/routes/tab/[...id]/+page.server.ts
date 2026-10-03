import type { PageServerLoad } from './$types';
import { tabService } from '$lib/server/sources/tab-service';
import { parseUGContent, getAllUniqueChords } from '$lib/parser/ug-parser';
import { normalizeUGApplicature, COMMON_CHORD_LIBRARY, type ChordDiagramData } from '$lib/music/chords';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const tabId = params.id;

	if (!tabId) {
		throw error(400, 'Missing tab ID');
	}

	let tab = await tabService.getTab(tabId);
	if (!tab) {
		// Self-healing recovery: attempt to find an active alternative version
		const alternative = await tabService.findAlternative(tabId);
		if (alternative && alternative.id && alternative.id !== tabId) {
			throw redirect(307, `/tab/${alternative.id}`);
		}
		throw error(404, 'Could not find this tab or it is unavailable.');
	}

	// Parse content into structured items
	const parsedItems = parseUGContent(tab.content);
	const uniqueChords = getAllUniqueChords(parsedItems);

	// Build diagrams map from applicature + fallback library
	const diagramsMap: Record<string, ChordDiagramData[]> = {};

	for (const chord of uniqueChords) {
		const variations: ChordDiagramData[] = [];

		if (tab.applicature && tab.applicature[chord]) {
			for (const ugVar of tab.applicature[chord]) {
				const normalized = normalizeUGApplicature(chord, ugVar);
				if (normalized) variations.push(normalized);
			}
		}

		if (variations.length === 0) {
			const fallback = COMMON_CHORD_LIBRARY[chord];
			if (fallback) {
				variations.push({ ...fallback, name: chord });
			}
		}

		diagramsMap[chord] = variations;
	}

	return {
		tab,
		parsedItems,
		uniqueChords,
		diagramsMap
	};
};
