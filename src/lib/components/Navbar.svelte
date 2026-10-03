<script lang="ts">
	import { Search, Guitar, Sun, Moon, Flame } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { theme } from '$lib/theme.svelte';

	interface Props {
		showSearch?: boolean;
	}

	let { showSearch = true }: Props = $props();

	let searchQuery = $state('');

	function handleSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!searchQuery.trim()) return;
		goto(`/?q=${encodeURIComponent(searchQuery.trim())}`);
	}
</script>

<header class="sticky top-0 z-30 w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
	<div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
		<!-- Brand Logo -->
		<a href="/" class="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group">
			<div class="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 transition-transform group-hover:scale-105">
				<Guitar class="w-4 h-4 stroke-[2.2]" />
			</div>
			<div class="flex items-center gap-1.5">
				<span class="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
					Tabspace
				</span>
			</div>
		</a>

		<!-- Navbar Search Bar (if showSearch is true) -->
		{#if showSearch}
			<form
				onsubmit={handleSearchSubmit}
				class="hidden md:flex items-center flex-1 max-w-sm mx-4 relative"
			>
				<Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 pointer-events-none" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search songs or artists..."
					class="w-full h-8 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 rounded-md pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none transition-colors"
				/>
			</form>
		{/if}

		<!-- Right Badges & Controls -->
		<div class="flex items-center gap-2">
			<!-- Theme Toggle Button -->
			<button
				type="button"
				onclick={() => theme.toggle()}
				class="h-8 w-8 rounded-md flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
				title={theme.current === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
				aria-label="Toggle theme"
			>
				{#if theme.current === 'dark'}
					<Sun class="w-4 h-4 text-zinc-300 hover:text-amber-400 transition-colors" />
				{:else}
					<Moon class="w-4 h-4 text-zinc-600 hover:text-indigo-600 transition-colors" />
				{/if}
			</button>

			<a
				href="/charts"
				class="text-xs font-medium px-2.5 py-1.5 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
			>
				<Flame class="w-3.5 h-3.5 text-amber-500" />
				<span>Charts</span>
			</a>

			<a
				href="/"
				class="text-xs font-medium px-2.5 py-1.5 rounded-md text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
			>
				Explore
			</a>
		</div>
	</div>
</header>
