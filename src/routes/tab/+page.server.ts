import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { UGTabAdapter } from '$lib/server/sources/ug-adapter';

export const load: PageServerLoad = async ({ url }) => {
	const id = url.searchParams.get('id');
	const legacyUrl = url.searchParams.get('url');

	if (id) {
		throw redirect(301, `/tab/${id}`);
	}
	if (legacyUrl) {
		const internalId = UGTabAdapter.toInternalId(legacyUrl);
		throw redirect(301, `/tab/${internalId}`);
	}

	throw redirect(302, '/');
};
