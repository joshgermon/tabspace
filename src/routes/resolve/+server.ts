import type { RequestHandler } from './$types';
import { tabService } from '$lib/server/sources/tab-service';
import { redirect } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q');
	if (!query || !query.trim()) {
		throw redirect(307, '/');
	}

	const trimmed = query.trim();
	try {
		const results = await tabService.search(trimmed, 'chords');
		if (results && results.length > 0) {
			throw redirect(307, `/tab/${results[0].id}`);
		}
	} catch (e: any) {
		if (e?.status === 307) throw e;
	}

	throw redirect(307, `/?q=${encodeURIComponent(trimmed)}`);
};
