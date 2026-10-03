<script lang="ts">
	import { page } from '$app/state';
	import Navbar from '$lib/components/Navbar.svelte';
	import { Search, Home, Music2, ArrowRight } from 'lucide-svelte';

	let searchQuery = $state('');

	function handleSearch(e: Event) {
		e.preventDefault();
		if (!searchQuery.trim()) return;
		window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
	}
</script>

<svelte:head>
	<title>{page.status} - Tabspace</title>
</svelte:head>

<div class="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased transition-colors duration-200">
	<Navbar />

	<main class="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-xl mx-auto">
		<!-- Status badge -->
		<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 dark:border dark:border-red-900/50 mb-6">
			<span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
			{page.status || 404} Error
		</div>

		<!-- Icon container -->
		<div class="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-6 shadow-sm">
			<Music2 class="w-8 h-8 text-zinc-500 dark:text-zinc-400" />
		</div>

		<h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
			Tab not found
		</h1>

		<p class="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
			{page.error?.message || "We couldn't find the tab or chord chart you're looking for. It may have been relocated or the link might be incomplete."}
		</p>

		<!-- Search Bar Form -->
		<form onsubmit={handleSearch} class="w-full relative mb-6">
			<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search song title or artist..."
				class="w-full pl-10 pr-24 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
			/>
			<button
				type="submit"
				class="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-colors"
			>
				Search
			</button>
		</form>

		<!-- Action buttons -->
		<div class="flex flex-wrap items-center justify-center gap-3">
			<a
				href="/"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-xs font-semibold transition-colors"
			>
				<Home class="w-3.5 h-3.5" />
				Back to Explore
			</a>
			<a
				href="/tab/ug--oasis--wonderwall-chords-6125"
				class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold transition-colors"
			>
				<span>Try Wonderwall</span>
				<ArrowRight class="w-3.5 h-3.5" />
			</a>
		</div>
	</main>

	<!-- Minimal Footer -->
	<footer class="py-6 border-t border-zinc-200 dark:border-zinc-800/60 text-center text-xs text-zinc-500">
		Tabspace &bull; Free chords & tabs for musicians
	</footer>
</div>
