import { json, type RequestHandler } from '@sveltejs/kit';
import { tabService } from '$lib/server/sources/tab-service';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q') || '';
	const type = url.searchParams.get('type') || undefined;

	if (!query.trim()) {
		return json({ success: true, results: [] });
	}

	try {
		const results = await tabService.search(query, type);
		return json({
			success: true,
			count: results.length,
			results
		});
	} catch (error: any) {
		return json(
			{
				success: false,
				message: error.message || 'Error occurred while searching tabs'
			},
			{ status: 500 }
		);
	}
};
