export type ChartSource = 'billboard' | 'apple';

export interface ChartTrack {
	rank: number;
	song: string;
	artist: string;
	artwork?: string;
	source: ChartSource;
	rankChange?: string; // "+1", "-2", "=", "NEW"
	peakPosition?: number;
	weeksOnChart?: number;
	genre?: string;
}

export interface ChartFeed {
	id: ChartSource;
	title: string;
	subtitle: string;
	updatedAt: string;
	tracks: ChartTrack[];
}
