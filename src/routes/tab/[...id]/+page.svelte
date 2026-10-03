<script lang="ts">
	import type { PageData } from './$types';
	import Navbar from '$lib/components/Navbar.svelte';
	import ControlsBar from '$lib/components/ControlsBar.svelte';
	import ChordGallery from '$lib/components/ChordGallery.svelte';
	import TabViewer from '$lib/components/TabViewer.svelte';
	import ChordPopover from '$lib/components/ChordPopover.svelte';
	import AutoScroll from '$lib/components/AutoScroll.svelte';
	import { transposeChord, COMMON_CHORD_LIBRARY, type ChordDiagramData } from '$lib/music/chords';
	import {
		ArrowLeft,
		Star,
		Share2,
		Printer,
		Check,
		Layers
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// Player & Display States
	let transpose = $state(0);
	let originalCapo = $derived(data.tab.capo ?? 0);
	let activeCapo = $state(0);

	$effect(() => {
		activeCapo = data.tab.capo ?? 0;
	});

	let fontSize = $state(100);
	let layoutMode = $state<'hybrid' | 'monospace'>('hybrid');
	let isAutoScrolling = $state(false);
	let copied = $state(false);

	// Chord Popover State
	let popoverChord = $state('');
	let popoverVariations = $state<ChordDiagramData[]>([]);
	let popoverOpen = $state(false);
	let popoverX = $state(0);
	let popoverY = $state(0);

	// Calculate total transposition offset
	let capoOffset = $derived(originalCapo - activeCapo);
	let totalOffset = $derived(transpose + capoOffset);

	// Transposed unique chords for the gallery
	let displayedUniqueChords = $derived(
		data.uniqueChords.map((c: string) => (totalOffset !== 0 ? transposeChord(c, totalOffset) : c))
	);

	function openChordPopover(chord: string, x: number, y: number) {
		popoverChord = chord;
		popoverX = x;
		popoverY = y;

		let vars = data.diagramsMap[chord] || [];
		if (vars.length === 0) {
			const fallback = COMMON_CHORD_LIBRARY[chord];
			if (fallback) {
				vars = [{ ...fallback, name: chord }];
			} else {
				vars = [{ frets: [-1, -1, -1, -1, -1, -1], name: chord }];
			}
		}
		popoverVariations = vars;
		popoverOpen = true;
	}

	function closeChordPopover() {
		popoverOpen = false;
	}

	function handleShare() {
		if (typeof navigator !== 'undefined' && navigator.clipboard) {
			navigator.clipboard.writeText(window.location.href);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}

	function handlePrint() {
		window.print();
	}
</script>

<svelte:head>
	<title>{data.tab.songName} by {data.tab.artistName} | Tabspace</title>
	<meta
		name="description"
		content="Guitar chords, tabs, and lyrics for {data.tab.songName} by {data.tab.artistName} with transposing, capo shifting, and auto-scroll."
	/>
</svelte:head>

<div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-150">
	<Navbar showSearch={true} />

	<main class="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 pb-28">
		<!-- Navigation & Actions Bar -->
		<div class="flex items-center justify-between gap-4 mb-4">
			<a
				href="/"
				class="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
			>
				<ArrowLeft class="w-3.5 h-3.5" />
				<span>Back</span>
			</a>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={handleShare}
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-2xs"
					title="Copy link to clipboard"
				>
					{#if copied}
						<Check class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
						<span class="text-emerald-600 dark:text-emerald-400">Copied</span>
					{:else}
						<Share2 class="w-3.5 h-3.5 text-zinc-400" />
						<span>Share</span>
					{/if}
				</button>

				<button
					type="button"
					onclick={handlePrint}
					class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shadow-2xs"
					title="Print tab sheet"
				>
					<Printer class="w-3.5 h-3.5 text-zinc-400" />
					<span>Print</span>
				</button>
			</div>
		</div>

		<!-- Song Header Details -->
		<div class="mb-6 pb-5 border-b border-zinc-200 dark:border-zinc-800">
			<div class="flex flex-wrap items-baseline gap-2 mb-1.5">
				<h1 class="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
					{data.tab.songName}
				</h1>
				<span class="text-base text-zinc-500 dark:text-zinc-400">
					by <a
						href={`/artist/${encodeURIComponent(data.tab.artistName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))}`}
						class="text-zinc-800 dark:text-zinc-200 font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
						title={`View songs by ${data.tab.artistName}`}
					>{data.tab.artistName}</a>
				</span>
			</div>

			<!-- Metadata Badges & Version Selector -->
			<div class="flex flex-wrap items-center gap-2 pt-1 text-xs">
				<span class="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
					{data.tab.type}
				</span>

				{#if data.tab.rating > 0}
					<div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 shadow-2xs">
						<Star class="w-3 h-3 fill-amber-400 text-amber-400" />
						<span class="font-semibold">{data.tab.rating}</span>
						{#if data.tab.votes}
							<span class="text-zinc-400 dark:text-zinc-500 text-[10px]">({data.tab.votes.toLocaleString()})</span>
						{/if}
					</div>
				{/if}

				{#if data.tab.difficulty}
					<span class="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 capitalize shadow-2xs">
						{data.tab.difficulty}
					</span>
				{/if}

				{#if data.tab.tonality}
					<span class="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-2xs">
						Key: <strong class="text-zinc-900 dark:text-zinc-200 font-semibold">
							{totalOffset !== 0 ? transposeChord(data.tab.tonality, totalOffset) : data.tab.tonality}
						</strong>
					</span>
				{/if}

				{#if data.tab.tuning}
					<span class="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-2xs">
						Tuning: <strong class="text-zinc-900 dark:text-zinc-200 font-semibold">{data.tab.tuning.value || data.tab.tuning.name}</strong>
					</span>
				{/if}

				{#if originalCapo > 0}
					<span class="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium shadow-2xs">
						Capo: {originalCapo}th fret
					</span>
				{/if}

				<!-- Versions Swapper -->
				{#if data.tab.versions && data.tab.versions.length > 1}
					<div class="inline-flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-1.5 py-0.5 shadow-2xs ml-auto">
						<Layers class="w-3 h-3 text-zinc-400" />
						<span class="text-[11px] font-medium text-zinc-500 mr-0.5">Version:</span>
						<div class="inline-flex items-center gap-1">
							{#each data.tab.versions as ver}
								<a
									href="/tab/{ver.id}"
									class="px-1.5 py-0.5 rounded text-[11px] font-mono font-medium transition-colors {ver.isCurrent
										? 'bg-indigo-600 text-white font-bold'
										: 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
									title="Version {ver.version} ({ver.rating}★, {ver.votes} votes)"
								>
									v{ver.version}
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Interactive Controls Toolbar -->
		<ControlsBar
			{transpose}
			onTransposeChange={(val: number) => (transpose = val)}
			{originalCapo}
			{activeCapo}
			onCapoChange={(newCapo: number) => (activeCapo = newCapo)}
			{fontSize}
			onFontSizeChange={(size: number) => (fontSize = size)}
			{layoutMode}
			onLayoutModeChange={(mode: 'hybrid' | 'monospace') => (layoutMode = mode)}
			{isAutoScrolling}
			onToggleAutoScroll={() => (isAutoScrolling = !isAutoScrolling)}
		/>

		<!-- Chord Diagrams Gallery (Top) -->
		{#if displayedUniqueChords.length > 0}
			<ChordGallery
				chords={displayedUniqueChords}
				diagramsMap={data.diagramsMap}
				onSelectChord={openChordPopover}
			/>
		{/if}

		<!-- Main Chord & Lyric Tab Content -->
		<TabViewer
			items={data.parsedItems}
			transposeOffset={totalOffset}
			{layoutMode}
			{fontSize}
			onChordClick={openChordPopover}
		/>

		<!-- Floating Auto-Scroller Controller -->
		<AutoScroll
			isPlaying={isAutoScrolling}
			onToggle={() => (isAutoScrolling = !isAutoScrolling)}
		/>

		<!-- Floating Chord Popover -->
		<ChordPopover
			chordName={popoverChord}
			variations={popoverVariations}
			isOpen={popoverOpen}
			anchorX={popoverX}
			anchorY={popoverY}
			onClose={closeChordPopover}
		/>
	</main>
</div>
