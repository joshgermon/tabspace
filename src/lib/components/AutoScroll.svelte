<script lang="ts">
	import { Play, Pause, Minus, Plus } from 'lucide-svelte';

	interface Props {
		isPlaying: boolean;
		onToggle: () => void;
	}

	let { isPlaying, onToggle }: Props = $props();

	// Calibrated speed levels (px per second)
	// 0.5x is 2.0px/sec (~1 lyric line per 15s) - ultra-slow, comfortable reading crawl
	const SPEED_PRESETS = [0.5, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0, 5.0];
	const SPEED_MAP: Record<number, number> = {
		0.5: 2.0,
		0.75: 3.2,
		1.0: 4.8,
		1.5: 8.0,
		2.0: 13.0,
		3.0: 22.0,
		4.0: 38.0,
		5.0: 60.0
	};

	let speedIndex = $state(2); // default to 1.0x (index 2)
	let currentSpeed = $derived(SPEED_PRESETS[speedIndex]);

	let scrollInterval: number | null = null;

	$effect(() => {
		if (isPlaying) {
			let lastTime = performance.now();
			let accumulated = 0;

			const tick = (now: number) => {
				if (!isPlaying) return;
				const delta = now - lastTime;
				lastTime = now;

				const pxPerSecond = SPEED_MAP[currentSpeed] || 4.8;
				accumulated += (delta * pxPerSecond) / 1000;

				if (accumulated >= 1) {
					const scrollAmount = Math.floor(accumulated);
					window.scrollBy({ top: scrollAmount, behavior: 'instant' });
					accumulated -= scrollAmount;
				}

				// Stop when reaching page bottom
				if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 8) {
					onToggle();
					return;
				}

				scrollInterval = requestAnimationFrame(tick);
			};

			scrollInterval = requestAnimationFrame(tick);
		} else {
			if (scrollInterval) {
				cancelAnimationFrame(scrollInterval);
				scrollInterval = null;
			}
		}

		return () => {
			if (scrollInterval) cancelAnimationFrame(scrollInterval);
		};
	});

	function handleKeydown(e: KeyboardEvent) {
		const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
		if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

		if (e.code === 'Space') {
			e.preventDefault();
			onToggle();
		} else if (e.code === 'ArrowUp' && isPlaying) {
			e.preventDefault();
			if (speedIndex > 0) speedIndex--;
		} else if (e.code === 'ArrowDown' && isPlaying) {
			e.preventDefault();
			if (speedIndex < SPEED_PRESETS.length - 1) speedIndex++;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed bottom-6 right-6 z-30 flex items-center gap-2 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl p-1.5 backdrop-blur-md text-zinc-900 dark:text-zinc-100 transition-all"
>
	<!-- Play / Pause Button -->
	<button
		type="button"
		onclick={onToggle}
		class="h-9 px-3 rounded-lg flex items-center gap-1.5 font-medium text-xs transition-colors cursor-pointer {isPlaying
			? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
			: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'}"
		title={isPlaying ? 'Pause auto-scroll (Space)' : 'Start auto-scroll (Space)'}
		aria-label={isPlaying ? 'Pause auto-scroll' : 'Start auto-scroll'}
	>
		{#if isPlaying}
			<Pause class="w-3.5 h-3.5 fill-current" />
			<span>Pause</span>
		{:else}
			<Play class="w-3.5 h-3.5 fill-current ml-0.5" />
			<span>Scroll</span>
		{/if}
	</button>

	<!-- Speed Controls -->
	<div class="flex items-center gap-1 px-1">
		<button
			type="button"
			disabled={speedIndex <= 0}
			onclick={() => {
				if (speedIndex > 0) speedIndex--;
			}}
			class="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
			title="Slower (Arrow Up)"
			aria-label="Slow down"
		>
			<Minus class="w-3.5 h-3.5" />
		</button>

		<span class="min-w-[40px] text-center font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
			{currentSpeed}x
		</span>

		<button
			type="button"
			disabled={speedIndex >= SPEED_PRESETS.length - 1}
			onclick={() => {
				if (speedIndex < SPEED_PRESETS.length - 1) speedIndex++;
			}}
			class="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 cursor-pointer"
			title="Faster (Arrow Down)"
			aria-label="Speed up"
		>
			<Plus class="w-3.5 h-3.5" />
		</button>
	</div>
</div>
