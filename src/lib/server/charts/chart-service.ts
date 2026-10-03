import type { ChartFeed, ChartTrack, ChartSource } from './types';
import { chartCache } from '../cache';

const FALLBACK_BILLBOARD_TRACKS: ChartTrack[] = [
	{
		rank: 1,
		song: "Choosin' Texas",
		artist: "Ella Langley",
		source: 'billboard',
		rankChange: '=',
		peakPosition: 1,
		weeksOnChart: 49
	},
	{
		rank: 2,
		song: "A Bar Song (Tipsy)",
		artist: "Shaboozey",
		source: 'billboard',
		rankChange: '+1',
		peakPosition: 1,
		weeksOnChart: 24
	},
	{
		rank: 3,
		song: "Birds of a Feather",
		artist: "Billie Eilish",
		source: 'billboard',
		rankChange: '+1',
		peakPosition: 2,
		weeksOnChart: 20
	},
	{
		rank: 4,
		song: "Espresso",
		artist: "Sabrina Carpenter",
		source: 'billboard',
		rankChange: '-2',
		peakPosition: 3,
		weeksOnChart: 25
	},
	{
		rank: 5,
		song: "Beautiful Things",
		artist: "Benson Boone",
		source: 'billboard',
		rankChange: '=',
		peakPosition: 2,
		weeksOnChart: 36
	},
	{
		rank: 6,
		song: "Good Luck, Babe!",
		artist: "Chappell Roan",
		source: 'billboard',
		rankChange: '+2',
		peakPosition: 4,
		weeksOnChart: 24
	},
	{
		rank: 7,
		song: "Lose Control",
		artist: "Teddy Swims",
		source: 'billboard',
		rankChange: '-1',
		peakPosition: 1,
		weeksOnChart: 58
	},
	{
		rank: 8,
		song: "I Had Some Help",
		artist: "Post Malone feat. Morgan Wallen",
		source: 'billboard',
		rankChange: '-1',
		peakPosition: 1,
		weeksOnChart: 21
	},
	{
		rank: 9,
		song: "Taste",
		artist: "Sabrina Carpenter",
		source: 'billboard',
		rankChange: '+3',
		peakPosition: 2,
		weeksOnChart: 6
	},
	{
		rank: 10,
		song: "Please Please Please",
		artist: "Sabrina Carpenter",
		source: 'billboard',
		rankChange: '-1',
		peakPosition: 1,
		weeksOnChart: 16
	}
];

export class ChartService {
	/**
	 * Retrieve Billboard Hot 100 chart
	 */
	async getBillboardHot100(limit = 50): Promise<ChartFeed> {
		const cacheKey = `chart:billboard:${limit}`;
		const cached = chartCache.get<ChartFeed>(cacheKey);
		if (cached) return cached;

		try {
			const res = await fetch(
				'https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main/recent.json',
				{ headers: { Accept: 'application/json' } }
			);

			if (!res.ok) throw new Error(`Billboard fetch failed: ${res.status}`);
			const json = await res.json();
			const rawData = Array.isArray(json.data) ? json.data : [];

			const tracks: ChartTrack[] = rawData.slice(0, limit).map((d: any) => {
				let rankChange = '=';
				if (d.last_week === null || d.last_week === undefined) {
					rankChange = 'NEW';
				} else {
					const diff = d.last_week - d.this_week;
					if (diff > 0) rankChange = `+${diff}`;
					else if (diff < 0) rankChange = `${diff}`;
				}

				return {
					rank: d.this_week,
					song: d.song,
					artist: d.artist,
					source: 'billboard',
					rankChange,
					peakPosition: d.peak_position,
					weeksOnChart: d.weeks_on_chart
				};
			});

			const feed: ChartFeed = {
				id: 'billboard',
				title: 'Billboard Hot 100',
				subtitle: 'The week’s most popular current songs across all genres',
				updatedAt: json.date || new Date().toISOString().split('T')[0],
				tracks: tracks.length > 0 ? tracks : FALLBACK_BILLBOARD_TRACKS.slice(0, limit)
			};

			chartCache.set(cacheKey, feed, 12 * 60 * 60 * 1000); // 12 hours
			return feed;
		} catch (e) {
			console.error('Failed to fetch Billboard Hot 100:', e);
			return {
				id: 'billboard',
				title: 'Billboard Hot 100',
				subtitle: 'The week’s most popular current songs across all genres',
				updatedAt: new Date().toISOString().split('T')[0],
				tracks: FALLBACK_BILLBOARD_TRACKS.slice(0, limit)
			};
		}
	}

	/**
	 * Retrieve Apple Music Top Most Played songs (global trending)
	 */
	async getAppleMusicTrending(limit = 50): Promise<ChartFeed> {
		const cacheKey = `chart:apple:${limit}`;
		const cached = chartCache.get<ChartFeed>(cacheKey);
		if (cached) return cached;

		try {
			const res = await fetch(
				`https://rss.applemarketingtools.com/api/v2/us/music/most-played/${limit}/songs.json`,
				{ headers: { Accept: 'application/json' } }
			);

			if (!res.ok) throw new Error(`Apple Music RSS failed: ${res.status}`);
			const json = await res.json();
			const rawList = json?.feed?.results || [];

			const tracks: ChartTrack[] = rawList.map((item: any, idx: number) => {
				const artwork = item.artworkUrl100
					? item.artworkUrl100.replace('100x100bb.jpg', '300x300bb.jpg')
					: undefined;

				const genre = item.genres?.[0]?.name;

				return {
					rank: idx + 1,
					song: item.name,
					artist: item.artistName,
					artwork,
					source: 'apple',
					genre
				};
			});

			const feed: ChartFeed = {
				id: 'apple',
				title: 'Global Top Most Played',
				subtitle: 'Real-time trending & streaming chart hits',
				updatedAt: json?.feed?.updated || new Date().toISOString().split('T')[0],
				tracks
			};

			chartCache.set(cacheKey, feed, 4 * 60 * 60 * 1000); // 4 hours
			return feed;
		} catch (e) {
			console.error('Failed to fetch Apple Music trending:', e);
			// Fallback using billboard data adapted
			const bb = await this.getBillboardHot100(limit);
			return {
				id: 'apple',
				title: 'Global Top Trending',
				subtitle: 'Real-time trending & streaming chart hits',
				updatedAt: bb.updatedAt,
				tracks: bb.tracks
			};
		}
	}

	/**
	 * Retrieve chart feed by ID
	 */
	async getChart(source: ChartSource = 'billboard', limit = 50): Promise<ChartFeed> {
		if (source === 'apple') {
			return this.getAppleMusicTrending(limit);
		}
		return this.getBillboardHot100(limit);
	}
}

export const chartService = new ChartService();
