<script lang="ts">
	import type { PageData } from './$types';
	import Navbar from '$lib/components/Navbar.svelte';
	import type { UnifiedSearchResult } from '$lib/server/sources/types';
	import {
		Search,
		Star,
		X,
		Guitar,
		Sliders,
		Sparkles,
		Clock,
		ArrowRight,
		BookOpen,
		Flame
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Search State
	let query = $state('');
	let selectedCategory = $state('all');
	let results = $state<UnifiedSearchResult[]>([]);
	let isLoading = $state(false);
	let recentSearches = $state<string[]>([]);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let searchInputRef: HTMLInputElement | null = null;

	let lastDataQuery: string | undefined = undefined;
	$effect(() => {
		if (data.query !== lastDataQuery) {
			lastDataQuery = data.query;
			if (data.query) {
				query = data.query;
				results = data.initialResults || [];
				selectedCategory = data.type || 'all';
			}
		}
	});

	const categories = [
		{ id: 'all', label: 'All Types' },
		{ id: 'chords', label: 'Chords' },
		{ id: 'tab', label: 'Tabs' },
		{ id: 'bass', label: 'Bass' },
		{ id: 'ukulele', label: 'Ukulele' }
	];

	// Curated Beginner Classics (Verified active tabs)
	const beginnerClassics = [
		{
			song: 'Wonderwall',
			artist: 'Oasis',
			type: 'Chords',
			difficulty: 'intermediate',
			rating: 4.6,
			votes: 2504,
			capo: 0,
			id: 'ug--oasis--wonderwall-chords-6125'
		},
		{
			song: 'Riptide',
			artist: 'Vance Joy',
			type: 'Chords',
			difficulty: 'novice',
			rating: 4.9,
			votes: 34893,
			capo: 1,
			id: 'ug--vance-joy--riptide-chords-1237247'
		},
		{
			song: 'Let It Be',
			artist: 'The Beatles',
			type: 'Chords',
			difficulty: 'novice',
			rating: 4.8,
			votes: 14170,
			capo: 0,
			id: 'ug--the-beatles--let-it-be-chords-17427'
		},
		{
			song: "Knockin' On Heaven's Door",
			artist: 'Bob Dylan',
			type: 'Chords',
			difficulty: 'novice',
			rating: 4.9,
			votes: 17572,
			capo: 0,
			id: 'ug--bob-dylan--knockin-on-heavens-door-chords-66559'
		}
	];

	// Curated Trending Hits (Verified active tabs)
	const trendingHits = [
		{
			song: 'Hotel California',
			artist: 'Eagles',
			type: 'Chords',
			difficulty: 'novice',
			rating: 4.9,
			votes: 40394,
			capo: 2,
			id: 'ug--eagles--hotel-california-chords-46190'
		},
		{
			song: 'Creep',
			artist: 'Radiohead',
			type: 'Chords',
			difficulty: 'novice',
			rating: 4.9,
			votes: 44378,
			capo: 0,
			id: 'ug--radiohead--creep-chords-4169'
		},
		{
			song: 'Hallelujah',
			artist: 'Jeff Buckley',
			type: 'Chords',
			difficulty: 'novice',
			rating: 4.9,
			votes: 58110,
			capo: 1,
			id: 'ug--jeff-buckley--hallelujah-chords-198052'
		},
		{
			song: 'Fast Car',
			artist: 'Tracy Chapman',
			type: 'Chords',
			difficulty: 'intermediate',
			rating: 4.8,
			votes: 6941,
			capo: 2,
			id: 'ug--tracy-chapman--fast-car-chords-1044807'
		}
	];

	function getArtistSlug(artist: string): string {
		const primary = artist.split(/\bfeat\.?|\bft\.?|&|,/i)[0].trim();
		return encodeURIComponent(primary.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
	}

	onMount(() => {
		try {
			const saved = localStorage.getItem('tabspace:recents');
			if (saved) recentSearches = JSON.parse(saved);
		} catch (e) {
			// ignore
		}

		// Keyboard shortcut / or Cmd+K to focus search
		const handleKey = (e: KeyboardEvent) => {
			if ((e.key === '/' || (e.metaKey && e.key === 'k')) && document.activeElement !== searchInputRef) {
				e.preventDefault();
				searchInputRef?.focus();
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});

	function saveRecentSearch(term: string) {
		if (!term.trim()) return;
		const clean = term.trim();
		const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
		recentSearches = updated;
		try {
			localStorage.setItem('tabspace:recents', JSON.stringify(updated));
		} catch (e) {}
	}

	function removeRecentSearch(term: string, e: MouseEvent) {
		e.stopPropagation();
		const updated = recentSearches.filter((s) => s !== term);
		recentSearches = updated;
		try {
			localStorage.setItem('tabspace:recents', JSON.stringify(updated));
		} catch (e) {}
	}

	async function performSearch(searchQuery: string, category: string) {
		const trimmed = searchQuery.trim();
		if (!trimmed) {
			results = [];
			isLoading = false;
			return;
		}

		isLoading = true;
		try {
			const catParam = category !== 'all' ? `&type=${category}` : '';
			const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}${catParam}`);
			const data = await res.json();
			if (data.success) {
				results = data.results;
				saveRecentSearch(trimmed);
			} else {
				results = [];
			}
		} catch (err) {
			console.error('Search failed:', err);
			results = [];
		} finally {
			isLoading = false;
		}
	}

	function handleQueryInput() {
		if (debounceTimer) clearTimeout(debounceTimer);
		if (!query.trim()) {
			results = [];
			isLoading = false;
			return;
		}

		debounceTimer = setTimeout(() => {
			performSearch(query, selectedCategory);
		}, 250);
	}

	function handleCategoryClick(catId: string) {
		selectedCategory = catId;
		if (query.trim()) {
			performSearch(query, catId);
		}
	}

	function handleRecentClick(term: string) {
		query = term;
		performSearch(term, selectedCategory);
	}

	function handleSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (debounceTimer) clearTimeout(debounceTimer);
		performSearch(query, selectedCategory);
	}

	function clearSearch() {
		query = '';
		results = [];
	}

	function openTab(tabId: string) {
		goto(`/tab/${tabId}`);
	}
</script>

<svelte:head>
	<title>Tabspace - Guitar Tabs & Chords</title>
	<meta
		name="description"
		content="Search over a million guitar chords, tabs, and lyrics. Clean, fast, free, with transposing, capo shifting, and chord diagrams."
	/>
</svelte:head>

<div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
	<Navbar showSearch={false} />

	<main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-16">
		<!-- Hero Section -->
		<div class="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
			<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-medium mb-4">
				<Sparkles class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
				<span>Over 1,000,000 free tabs & chords</span>
			</div>

			<h1 class="text-3xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
				Guitar tabs without the clutter.
			</h1>

			<p class="text-zinc-500 dark:text-zinc-400 text-sm sm:text-base leading-relaxed">
				Accurate chords over lyrics, real-time transposition, and interactive fretboard diagrams in a clean, ad-free player.
			</p>
		</div>

		<!-- Main Search Box (shadcn style) -->
		<div class="max-w-2xl mx-auto mb-10">
			<form
				onsubmit={handleSearchSubmit}
				class="relative flex items-center shadow-xs rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all p-1.5"
			>
				<Search class="w-4 h-4 text-zinc-400 ml-3 pointer-events-none" />
				<input
					bind:this={searchInputRef}
					type="text"
					bind:value={query}
					oninput={handleQueryInput}
					placeholder="Search by song, artist, or chords (e.g. Wonderwall, Adele)..."
					class="w-full bg-transparent border-none text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 px-3 py-2 text-sm outline-none"
					autocomplete="off"
				/>

				{#if query}
					<button
						type="button"
						onclick={clearSearch}
						class="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors mr-1 cursor-pointer"
						aria-label="Clear search"
					>
						<X class="w-3.5 h-3.5" />
					</button>
				{:else}
					<kbd class="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 font-mono text-[10px] font-medium text-zinc-400 mr-2">
						/
					</kbd>
				{/if}

				<button
					type="submit"
					class="h-8 px-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-medium text-xs rounded-lg transition-all shadow-xs cursor-pointer"
				>
					Search
				</button>
			</form>

			<!-- Category Filter Pills -->
			<div class="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
				{#each categories as cat}
					<button
						type="button"
						onclick={() => handleCategoryClick(cat.id)}
						class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer {selectedCategory === cat.id
							? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold shadow-2xs'
							: 'bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}"
					>
						{cat.label}
					</button>
				{/each}
			</div>

			<!-- Recent Searches -->
			{#if recentSearches.length > 0 && !query}
				<div class="mt-3.5 flex items-center justify-center gap-1.5 flex-wrap text-xs text-zinc-500">
					<span class="inline-flex items-center gap-1 text-zinc-400 text-[11px]">
						<Clock class="w-3 h-3" /> Recent:
					</span>
					{#each recentSearches as term}
						<button
							type="button"
							onclick={() => handleRecentClick(term)}
							class="group inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs transition-colors cursor-pointer"
						>
							<span>{term}</span>
							<span
								role="button"
								tabindex="0"
								onclick={(e) => removeRecentSearch(term, e)}
								onkeydown={(e) => { if (e.key === 'Enter') removeRecentSearch(term, e as any); }}
								class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 ml-0.5"
								aria-label="Remove recent search"
							>
								×
							</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Loading State -->
		{#if isLoading}
			<div class="max-w-2xl mx-auto py-12 flex flex-col items-center justify-center gap-2.5">
				<div class="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-700 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
				<span class="text-xs text-zinc-500 dark:text-zinc-400">Searching tabs...</span>
			</div>

		<!-- Active Search Results -->
		{:else if query && results.length > 0}
			<div class="max-w-2xl mx-auto">
				<div class="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800 mb-3">
					<h2 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
						Results for "{query}" ({results.length})
					</h2>
				</div>

				<div class="flex flex-col gap-1.5">
					{#each results as result}
						<button
							type="button"
							onclick={() => openTab(result.id)}
							class="w-full text-left p-3 rounded-lg bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
						>
							<div class="flex flex-col gap-0.5 min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-semibold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
										{result.songName}
									</span>
									<span class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider {result.type.toLowerCase() === 'chords' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'}">
										{result.type}
									</span>
									{#if result.version > 1}
										<span class="text-[11px] text-zinc-400 font-mono">v{result.version}</span>
									{/if}
								</div>

								<div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
									<span>{result.artistName}</span>
									{#if result.difficulty}
										<span class="text-zinc-400 dark:text-zinc-500 capitalize">• {result.difficulty}</span>
									{/if}
								</div>
							</div>

							<!-- Rating & Arrow -->
							<div class="flex items-center gap-2.5 flex-shrink-0">
								{#if result.rating > 0}
									<div class="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
										<Star class="w-3 h-3 fill-amber-400 text-amber-400" />
										<span class="font-semibold text-zinc-800 dark:text-zinc-200">{result.rating}</span>
										{#if result.votes}
											<span class="text-zinc-400 dark:text-zinc-500 text-[10px]">({result.votes.toLocaleString()})</span>
										{/if}
									</div>
								{/if}

								<ArrowRight class="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
							</div>
						</button>
					{/each}
				</div>
			</div>

		<!-- Search Empty State -->
		{:else if query && results.length === 0}
			<div class="max-w-md mx-auto py-12 text-center">
				<div class="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto mb-2.5 text-zinc-400">
					<Search class="w-4 h-4" />
				</div>
				<h3 class="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1">No results for "{query}"</h3>
				<p class="text-xs text-zinc-500 dark:text-zinc-400">
					Check your spelling or try searching another artist or track name.
				</p>
			</div>

		<!-- Discovery / Home Curated Sections (when not searching) -->
		{:else}
			<div class="space-y-10 max-w-4xl mx-auto">
				<!-- Live Trending Charts Spotlight -->
				{#if data.trendingChart && data.trendingChart.tracks && data.trendingChart.tracks.length > 0}
					<section>
						<div class="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800 mb-3.5">
							<div class="flex items-center gap-2">
								<Flame class="w-4 h-4 text-amber-500 fill-amber-500" />
								<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
									Top Trending Charts
								</h2>
								<span class="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
									Live Public Charts
								</span>
							</div>
							<a
								href="/charts"
								class="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
							>
								<span>View All Charts</span>
								<ArrowRight class="w-3.5 h-3.5" />
							</a>
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
							{#each data.trendingChart.tracks.slice(0, 6) as track}
								<div class="p-3 rounded-lg bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between gap-2.5 shadow-2xs group">
									<div class="flex items-center gap-2.5 min-w-0">
										<span class="w-5 text-center text-xs font-bold text-zinc-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0">
											#{track.rank}
										</span>
										<div class="min-w-0">
											<a
												data-sveltekit-reload
												href={`/resolve?q=${encodeURIComponent(`${track.song} ${track.artist}`)}`}
												class="block font-semibold text-xs text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
												title={`View chords for ${track.song}`}
											>
												{track.song}
											</a>
											<a
												href={`/artist/${getArtistSlug(track.artist)}`}
												class="block text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 hover:underline truncate"
												title={`View all songs by ${track.artist}`}
											>
												{track.artist}
											</a>
										</div>
									</div>

									<a
										data-sveltekit-reload
										href={`/resolve?q=${encodeURIComponent(`${track.song} ${track.artist}`)}`}
										class="shrink-0 px-2 py-1 rounded bg-zinc-100 hover:bg-indigo-600 hover:text-white dark:bg-zinc-800 dark:hover:bg-indigo-600 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
									>
										Chords
									</a>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Curated: Beginner Classics -->
				<section>
					<div class="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800 mb-3.5">
						<div class="flex items-center gap-2">
							<BookOpen class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
							<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
								Essential Beginner Songs
							</h2>
						</div>
						<span class="text-xs text-zinc-400">Simple chord progressions</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
						{#each beginnerClassics as song}
							<div
								class="p-3.5 rounded-lg bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between text-left group shadow-2xs"
							>
								<div class="flex flex-col gap-0.5 min-w-0">
									<div class="flex items-center gap-2">
										<a
											href={`/tab/${song.id}`}
											class="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
										>
											{song.song}
										</a>
										<span class="px-1.5 py-0.5 rounded text-[10px] font-medium capitalize bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 shrink-0">
											{song.difficulty}
										</span>
									</div>
									<div class="text-xs text-zinc-500 dark:text-zinc-400">
										<a
											href={`/artist/${getArtistSlug(song.artist)}`}
											class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
											title={`View ${song.artist} tabs`}
										>
											{song.artist}
										</a>
										{#if song.capo > 0}
											<span class="text-zinc-400">• Capo {song.capo}</span>
										{/if}
									</div>
								</div>

								<a
									href={`/tab/${song.id}`}
									class="flex items-center gap-2 shrink-0 ml-3"
									aria-label={`Open ${song.song}`}
								>
									<div class="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
										<Star class="w-3 h-3 fill-amber-400 text-amber-400" />
										<span class="font-medium">{song.rating}</span>
									</div>
									<ArrowRight class="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
								</a>
							</div>
						{/each}
					</div>
				</section>

				<!-- Curated: Trending Classics -->
				<section>
					<div class="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800 mb-3.5">
						<div class="flex items-center gap-2">
							<Flame class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
							<h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
								Popular Songs
							</h2>
						</div>
						<span class="text-xs text-zinc-400">Community favorites</span>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
						{#each trendingHits as song}
							<div
								class="p-3.5 rounded-lg bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex items-center justify-between text-left group shadow-2xs"
							>
								<div class="flex flex-col gap-0.5 min-w-0">
									<a
										href={`/tab/${song.id}`}
										class="font-semibold text-sm text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
									>
										{song.song}
									</a>
									<div class="text-xs text-zinc-500 dark:text-zinc-400">
										<a
											href={`/artist/${getArtistSlug(song.artist)}`}
											class="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
											title={`View ${song.artist} tabs`}
										>
											{song.artist}
										</a>
										{#if song.capo > 0}
											<span class="text-zinc-400">• Capo {song.capo}</span>
										{/if}
									</div>
								</div>

								<a
									href={`/tab/${song.id}`}
									class="flex items-center gap-2 shrink-0 ml-3"
									aria-label={`Open ${song.song}`}
								>
									<div class="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400">
										<Star class="w-3 h-3 fill-amber-400 text-amber-400" />
										<span class="font-medium">{song.rating}</span>
									</div>
									<ArrowRight class="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
								</a>
							</div>
						{/each}
					</div>
				</section>

				<!-- Feature Highlights for Musicians -->
				<section class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
					<div class="p-3.5 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 shadow-2xs">
						<div class="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-2">
							<Sliders class="w-3.5 h-3.5" />
						</div>
						<h3 class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 mb-1">Smart Capo & Transpose</h3>
						<p class="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
							Shift semitones instantly or toggle between finger shapes and sounding concert pitch.
						</p>
					</div>

					<div class="p-3.5 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 shadow-2xs">
						<div class="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-2">
							<Guitar class="w-3.5 h-3.5" />
						</div>
						<h3 class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 mb-1">Interactive Chord Diagrams</h3>
						<p class="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
							Tap or hover any chord badge to view exact fret numbers, finger positions, and open strings.
						</p>
					</div>

					<div class="p-3.5 rounded-lg bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 shadow-2xs">
						<div class="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 mb-2">
							<Clock class="w-3.5 h-3.5" />
						</div>
						<h3 class="font-semibold text-xs text-zinc-900 dark:text-zinc-100 mb-1">Smooth Auto-Scroll</h3>
						<p class="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
							Calibrated speed controls starting at a slow reading crawl with Spacebar pause/play.
						</p>
					</div>
				</section>
			</div>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="border-t border-zinc-200 dark:border-zinc-800/80 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500 bg-white dark:bg-zinc-950 transition-colors">
		<div class="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
			<div class="flex items-center gap-2">
				<Guitar class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
				<span class="font-semibold text-zinc-800 dark:text-zinc-200">Tabspace</span>
				<span>— Clean music tabs for guitarists</span>
			</div>
			<div>
				Data proxied from public community tab archives.
			</div>
		</div>
	</footer>
</div>
