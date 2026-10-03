<script lang="ts">
	import type { PageData } from './$types';
	import Navbar from '$lib/components/Navbar.svelte';
	import { 
		Search, 
		Flame, 
		Star, 
		Music2, 
		Filter, 
		ArrowRight, 
		ChevronRight,
		SlidersHorizontal,
		Layers
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let groupBySong = $state(true);

	const categories = [
		{ id: 'all', label: 'All Types' },
		{ id: 'chords', label: 'Chords' },
		{ id: 'tab', label: 'Tabs' },
		{ id: 'ukulele', label: 'Ukulele' },
		{ id: 'bass', label: 'Bass' }
	];

	// Filter and group tabs
	let displayedTabs = $derived.by(() => {
		let list = data.catalog.tabs;

		// Filter by category
		if (selectedCategory !== 'all') {
			list = list.filter((t) => t.type.toLowerCase().includes(selectedCategory));
		}

		// Filter by client search query
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase().trim();
			list = list.filter((t) => t.songName.toLowerCase().includes(q));
		}

		// Group by song (best version only) if toggled
		if (groupBySong) {
			const seen = new Map<string, { tab: typeof list[0]; count: number }>();
			for (const tab of list) {
				const key = `${tab.songName.toLowerCase()}::${tab.type.toLowerCase()}`;
				if (!seen.has(key)) {
					seen.set(key, { tab, count: 1 });
				} else {
					seen.get(key)!.count += 1;
				}
			}
			return Array.from(seen.values()).map(({ tab, count }) => ({
				...tab,
				versionsCount: count
			}));
		}

		return list.map((tab) => ({ ...tab, versionsCount: 1 }));
	});

	function getTypeBadgeClass(type: string): string {
		const lower = type.toLowerCase();
		if (lower.includes('chord')) return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border dark:border-indigo-800/40';
		if (lower.includes('tab')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/40';
		if (lower.includes('ukulele')) return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:border dark:border-amber-800/40';
		if (lower.includes('bass')) return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:border dark:border-purple-800/40';
		return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';
	}
</script>

<svelte:head>
	<title>{data.catalog.artist.name} Guitar Tabs & Chords - Tabspace</title>
	<meta name="description" content="Explore {data.catalog.artist.name} songs ranked by popularity. Accurate guitar chords, tabs, and ukulele charts." />
</svelte:head>

<div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased transition-colors duration-200">
	<Navbar />

	<main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
		<!-- Breadcrumbs -->
		<nav class="flex items-center gap-1.5 text-xs text-zinc-500 mb-6 font-medium">
			<a href="/" class="hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Home</a>
			<ChevronRight class="w-3.5 h-3.5 text-zinc-400" />
			<span class="text-zinc-400">Artists</span>
			<ChevronRight class="w-3.5 h-3.5 text-zinc-400" />
			<span class="text-zinc-900 dark:text-zinc-100 font-semibold">{data.catalog.artist.name}</span>
		</nav>

		<!-- Artist Header Card -->
		<div class="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 mb-8 shadow-sm">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div>
					<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40 mb-3">
						<Music2 class="w-3 h-3" />
						Artist Discography
					</div>
					<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight">
						{data.catalog.artist.name}
					</h1>
					<p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
						Ranked by community popularity &bull; {data.catalog.tabs.length} charts cataloged
					</p>
				</div>

				<div class="flex items-center gap-2">
					<span class="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
						<Flame class="w-3.5 h-3.5 text-amber-500" />
						Popularity Ordered
					</span>
				</div>
			</div>
		</div>

		<!-- Toolbar: Search, Filters & Grouping -->
		<div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
			<!-- Search filter input -->
			<div class="relative flex-1 max-w-md">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder={`Filter ${data.catalog.artist.name} songs...`}
					class="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
				/>
			</div>

			<!-- Filter categories and group toggle -->
			<div class="flex flex-wrap items-center gap-2">
				<div class="flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs">
					{#each categories as cat}
						<button
							type="button"
							onclick={() => (selectedCategory = cat.id)}
							class={`px-2.5 py-1 rounded-md transition-all ${
								selectedCategory === cat.id
									? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold shadow-xs'
									: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
							}`}
						>
							{cat.label}
						</button>
					{/each}
				</div>

				<!-- Group by song toggle -->
				<button
					type="button"
					onclick={() => (groupBySong = !groupBySong)}
					class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
						groupBySong
							? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
							: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400'
					}`}
					title={groupBySong ? 'Showing highest rated version of each song' : 'Showing all individual versions'}
				>
					<Layers class="w-3.5 h-3.5" />
					<span>Best Version</span>
				</button>
			</div>
		</div>

		<!-- Song List -->
		{#if displayedTabs.length === 0}
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
				<Music2 class="w-8 h-8 text-zinc-400 mx-auto mb-3" />
				<p class="text-sm font-semibold text-zinc-800 dark:text-zinc-200">No matching songs found</p>
				<p class="text-xs text-zinc-500 mt-1">Try adjusting your search filter or selecting another category.</p>
				<button
					type="button"
					onclick={() => { searchQuery = ''; selectedCategory = 'all'; }}
					class="mt-4 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
				>
					Reset filters
				</button>
			</div>
		{:else}
			<div class="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80 shadow-sm overflow-hidden">
				{#each displayedTabs as tab, idx}
					<a
						href={`/tab/${tab.id}`}
						class="flex items-center justify-between p-4 sm:px-6 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
					>
						<div class="flex items-center gap-3 sm:gap-4 min-w-0">
							<!-- Popularity Rank -->
							<span class={`w-6 sm:w-7 text-xs sm:text-sm font-bold text-center shrink-0 ${
								idx === 0
									? 'text-amber-500 font-extrabold'
									: idx === 1
									? 'text-zinc-400 dark:text-zinc-300 font-bold'
									: idx === 2
									? 'text-amber-700 dark:text-amber-600 font-bold'
									: 'text-zinc-400 dark:text-zinc-500'
							}`}>
								#{idx + 1}
							</span>

							<!-- Song Details -->
							<div class="min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<h2 class="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
										{tab.songName}
									</h2>

									<span class={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getTypeBadgeClass(tab.type)}`}>
										{tab.type}
									</span>

									{#if !groupBySong && tab.version > 1}
										<span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
											v{tab.version}
										</span>
									{/if}

									{#if groupBySong && tab.versionsCount > 1}
										<span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
											{tab.versionsCount} versions
										</span>
									{/if}
								</div>

								<div class="flex items-center gap-3 text-xs text-zinc-500 mt-1">
									<span class="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
										<Star class="w-3 h-3 fill-amber-400 text-amber-400" />
										{tab.rating.toFixed(1)}
									</span>
									<span>&bull;</span>
									<span>{tab.votes.toLocaleString()} votes</span>
									{#if tab.difficulty}
										<span>&bull;</span>
										<span class="capitalize">{tab.difficulty}</span>
									{/if}
								</div>
							</div>
						</div>

						<!-- Action arrow button -->
						<div class="flex items-center gap-2 shrink-0 ml-4">
							<span class="hidden sm:inline-flex items-center text-xs font-semibold text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
								View Tab
							</span>
							<div class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-600 flex items-center justify-center transition-colors">
								<ArrowRight class="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-white transition-colors" />
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>

	<!-- Footer -->
	<footer class="py-6 border-t border-zinc-200 dark:border-zinc-800/60 text-center text-xs text-zinc-500">
		Tabspace &bull; Free chords & tabs for musicians
	</footer>
</div>
