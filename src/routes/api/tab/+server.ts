import { json, type RequestHandler } from '@sveltejs/kit';
import { tabService } from '$lib/server/sources/tab-service';
import { UGTabAdapter } from '$lib/server/sources/ug-adapter';

export const GET: RequestHandler = async ({ url }) => {
	let tabId = url.searchParams.get('id');
	const legacyUrl = url.searchParams.get('url');

	if (!tabId && legacyUrl) {
		tabId = UGTabAdapter.toInternalId(legacyUrl);
	}

	if (!tabId) {
		return json(
			{ success: false, message: 'Missing required "id" parameter' },
			{ status: 400 }
		);
	}

	try {
		let tab = await tabService.getTab(tabId);
		let resolvedId = tabId;

		if (!tab) {
			const alternative = await tabService.findAlternative(tabId);
			if (alternative && alternative.id) {
				tab = await tabService.getTab(alternative.id);
				resolvedId = alternative.id;
			}
		}

		if (!tab) {
			return json(
				{ success: false, message: 'Tab not found or unable to parse content' },
				{ status: 404 }
			);
		}

		return json({
			success: true,
			tab,
			resolvedFrom: resolvedId !== tabId ? tabId : undefined
		});
	} catch (error: any) {
		return json(
			{
				success: false,
				message: error.message || 'Error occurred while fetching tab'
			},
			{ status: 500 }
		);
	}
};
