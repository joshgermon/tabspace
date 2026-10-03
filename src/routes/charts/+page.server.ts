import type { PageServerLoad } from './$types';
import { chartService } from '$lib/server/charts/chart-service';

export const load: PageServerLoad = async () => {
	const [billboardChart, appleChart] = await Promise.all([
		chartService.getBillboardHot100(50),
		chartService.getAppleMusicTrending(50)
	]);

	return {
		billboardChart,
		appleChart
	};
};
