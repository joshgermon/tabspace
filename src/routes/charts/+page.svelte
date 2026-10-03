<script lang="ts">
	import type { PageData } from './$types';
	import Navbar from '$lib/components/Navbar.svelte';
	import { 
		Flame, 
		TrendingUp, 
		TrendingDown, 
		Minus, 
		Search, 
		Sparkles, 
		Music2, 
		ExternalLink, 
		Play,
		Guitar
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let selectedSource = $state<'billboard' | 'apple'>('billboard');
	let searchQuery = $state('');

	const currentFeed = $derived(
		selectedSource === 'billboard' ? data.billboardChart : data.appleChart
	);

	const displayedTracks = $derived.by(() => {
		const tracks = currentFeed.tracks;
		if (!searchQuery.trim()) return tracks;
		const q = searchQuery.toLowerCase().trim();
		return tracks.filter(
			(t) => t.song.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
		);
	});

	function getArtistSlug(artist: string): string {
		// Clean artist name into URL slug: take primary artist before 'feat', '&', ',', etc.
		const primary = artist.split(/\bfeat\.?|\bft\.?|&|,/i)[0].trim();
		return encodeURIComponent(primary.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
	}
</script>

<svelte:head>
	<title>Top Trending Songs & Charts - Tabspace</title>
	<meta name="description" content="Discover top trending songs from Billboard Hot 100 and Global Streaming charts with instant guitar tabs and chords." />
</svelte:head>

<div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased transition-colors duration-200">
	<Navbar />

	<main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
		<!-- Hero Header -->
		<div class="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
			<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 mb-3">
				<Flame class="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
				Trending Chords & Tabs
			</div>
			<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
				Top Trending Songs
			</h1>
			<p class="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
				Explore what the world is listening to right now from live public music charts. Click any song to instantly load chords, capo settings, and tabs.
			</p>
		</div>

		<!-- Chart Source Switcher & Filter Bar -->
		<div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
			<!-- Chart Tabs -->
			<div class="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs sm:text-sm font-semibold">
				<button
					type="button"
					onclick={() => (selectedSource = 'billboard')}
					class={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all ${
						selectedSource === 'billboard'
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
							: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
					}`}
				>
					<span>Billboard Hot 100</span>
				</button>

				<button
					type="button"
					onclick={() => (selectedSource = 'apple')}
					class={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all ${
						selectedSource === 'apple'
							? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-bold'
							: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
					}`}
				>
					<span>Global Streaming 50</span>
				</button>
			</div>

			<!-- Filter search -->
			<div class="relative w-full sm:w-72">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search chart songs or artists..."
					class="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
				/>
			</div>
		</div>

		<!-- Chart Metadata bar -->
		<div class="flex items-center justify-between text-xs text-zinc-500 mb-4 px-1">
			<span>Showing {displayedTracks.length} tracks &bull; Updated: {currentFeed.updatedAt}</span>
			<span>Source: {selectedSource === 'billboard' ? 'Billboard Hot 100 Chart' : 'Global Streaming Chart'}</span>
		</div>

		<!-- Track List Table / Cards -->
		{#if displayedTracks.length === 0}
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
				<Music2 class="w-8 h-8 text-zinc-400 mx-auto mb-3" />
				<p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No chart tracks match "{searchQuery}"</p>
				<button
					type="button"
					onclick={() => (searchQuery = '')}
					class="mt-3 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
				>
					Clear filter
				</button>
			</div>
		{:else}
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 shadow-sm overflow-hidden">
				{#each displayedTracks as track}
					<div class="flex items-center justify-between p-3.5 sm:px-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors gap-3">
						<!-- Left section: Rank + Artwork + Song Info -->
						<div class="flex items-center gap-3 sm:gap-4 min-w-0">
							<!-- Rank & Movement -->
							<div class="w-8 text-center shrink-0">
								<span class={`text-sm sm:text-base font-extrabold ${
									track.rank === 1
										? 'text-amber-500'
										: track.rank === 2
										? 'text-zinc-400 dark:text-zinc-300'
										: track.rank === 3
										? 'text-amber-700 dark:text-amber-600'
										: 'text-zinc-400 dark:text-zinc-500'
								}`}>
									{track.rank}
								</span>

								{#if track.rankChange}
									<div class="flex items-center justify-center text-[10px] font-semibold mt-0.5">
										{#if track.rankChange === 'NEW'}
											<span class="text-blue-500">NEW</span>
										{:else if track.rankChange.startsWith('+')}
											<span class="text-emerald-500 flex items-center">
												<TrendingUp class="w-2.5 h-2.5 inline" />
												{track.rankChange.slice(1)}
											</span>
										{:else if track.rankChange.startsWith('-')}
											<span class="text-red-500 flex items-center">
												<TrendingDown class="w-2.5 h-2.5 inline" />
												{track.rankChange.slice(1)}
											</span>
										{:else}
											<span class="text-zinc-400">
												<Minus class="w-2.5 h-2.5 inline" />
											</span>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Thumbnail Artwork -->
							{#if track.artwork}
								<img
									src={track.artwork}
									alt={`${track.song} cover`}
									loading="lazy"
									class="w-11 h-11 rounded-lg object-cover shrink-0 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs"
								/>
							{:else}
								<div class="w-11 h-11 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-center shrink-0">
									<Guitar class="w-5 h-5 text-zinc-400" />
								</div>
							{/if}

							<!-- Song title & artist link -->
							<div class="min-w-0">
								<h2 class="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
									{track.song}
								</h2>

								<div class="flex items-center gap-2 text-xs text-zinc-500 mt-0.5 flex-wrap">
									<a
										href={`/artist/${getArtistSlug(track.artist)}`}
										class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline font-medium truncate"
										title={`View ${track.artist} songs`}
									>
										{track.artist}
									</a>

									{#if track.weeksOnChart}
										<span>&bull;</span>
										<span class="text-zinc-400">{track.weeksOnChart} wks</span>
									{/if}

									{#if track.peakPosition}
										<span>&bull;</span>
										<span class="text-zinc-400">Peak #{track.peakPosition}</span>
									{/if}

									{#if track.genre}
										<span>&bull;</span>
										<span class="text-zinc-400">{track.genre}</span>
									{/if}
								</div>
							</div>
						</div>

						<!-- Right action: Find / Play Chords button -->
						<div class="shrink-0 flex items-center gap-2">
							<a
								data-sveltekit-reload
								href={`/resolve?q=${encodeURIComponent(`${track.song} ${track.artist}`)}`}
								class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-semibold shadow-xs transition-colors"
							>
								<Guitar class="w-3.5 h-3.5" />
								<span>Chords</span>
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="py-6 border-t border-zinc-200 dark:border-zinc-800/60 text-center text-xs text-zinc-500">
		Tabspace &bull; Free chords & tabs for musicians &bull; Charts updated regularly
	</footer>
</div>
