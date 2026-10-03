<script lang="ts">
	import {
		Minus,
		Plus,
		RotateCcw,
		Play,
		Pause
	} from 'lucide-svelte';

	interface Props {
		transpose: number;
		onTransposeChange: (newVal: number) => void;
		originalCapo?: number;
		activeCapo: number;
		onCapoChange: (newCapo: number) => void;
		fontSize: number; // percentage
		onFontSizeChange: (newSize: number) => void;
		layoutMode: 'hybrid' | 'monospace';
		onLayoutModeChange: (mode: 'hybrid' | 'monospace') => void;
		isAutoScrolling: boolean;
		onToggleAutoScroll: () => void;
	}

	let {
		transpose,
		onTransposeChange,
		originalCapo,
		activeCapo,
		onCapoChange,
		fontSize,
		onFontSizeChange,
		layoutMode,
		onLayoutModeChange,
		isAutoScrolling,
		onToggleAutoScroll
	}: Props = $props();

	let hasOriginalCapo = $derived(originalCapo !== undefined && originalCapo > 0);
	let isNoCapoMode = $derived(activeCapo === 0 && hasOriginalCapo);

	function toggleNoCapo() {
		if (activeCapo === 0 && hasOriginalCapo) {
			onCapoChange(originalCapo ?? 0);
		} else {
			onCapoChange(0);
		}
	}
</script>

<div
	class="w-full bg-white dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 mb-6 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
>
	<!-- Transpose Controls -->
	<div class="flex items-center gap-1.5">
		<span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Transpose</span>
		<div class="inline-flex items-center bg-zinc-50 dark:bg-zinc-950/70 rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5">
			<button
				type="button"
				onclick={() => onTransposeChange(transpose - 1)}
				class="p-1 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
				title="Transpose down 1 semitone"
				aria-label="Transpose down"
			>
				<Minus class="w-3.5 h-3.5" />
			</button>

			<span class="px-2 text-xs font-mono font-semibold {transpose !== 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-800 dark:text-zinc-200'}">
				{transpose > 0 ? `+${transpose}` : transpose}
			</span>

			<button
				type="button"
				onclick={() => onTransposeChange(transpose + 1)}
				class="p-1 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
				title="Transpose up 1 semitone"
				aria-label="Transpose up"
			>
				<Plus class="w-3.5 h-3.5" />
			</button>

			{#if transpose !== 0}
				<button
					type="button"
					onclick={() => onTransposeChange(0)}
					class="p-1 ml-0.5 rounded text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
					title="Reset transposition"
					aria-label="Reset transposition"
				>
					<RotateCcw class="w-3 h-3" />
				</button>
			{/if}
		</div>
	</div>

	<!-- Capo Controls -->
	<div class="flex items-center gap-1.5">
		<span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Capo</span>

		{#if hasOriginalCapo}
			<button
				type="button"
				onclick={toggleNoCapo}
				class="px-2 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer {isNoCapoMode
					? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
					: 'bg-zinc-50 dark:bg-zinc-950/70 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}"
				title={isNoCapoMode ? 'Capo removed (sounding concert pitch)' : `Playing with Capo on fret ${originalCapo}`}
			>
				{isNoCapoMode ? 'No Capo' : `Capo ${activeCapo}`}
			</button>
		{/if}

		<div class="inline-flex items-center bg-zinc-50 dark:bg-zinc-950/70 rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5">
			<button
				type="button"
				disabled={activeCapo <= 0}
				onclick={() => onCapoChange(Math.max(0, activeCapo - 1))}
				class="p-1 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
				aria-label="Capo down"
			>
				<Minus class="w-3.5 h-3.5" />
			</button>

			<span class="px-2 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200">
				{activeCapo === 0 ? 'None' : `Fret ${activeCapo}`}
			</span>

			<button
				type="button"
				disabled={activeCapo >= 12}
				onclick={() => onCapoChange(Math.min(12, activeCapo + 1))}
				class="p-1 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 disabled:opacity-30 transition-colors cursor-pointer"
				aria-label="Capo up"
			>
				<Plus class="w-3.5 h-3.5" />
			</button>
		</div>
	</div>

	<!-- Font Sizing Stepper -->
	<div class="flex items-center gap-1.5">
		<span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Size</span>
		<div class="inline-flex items-center bg-zinc-50 dark:bg-zinc-950/70 rounded-md border border-zinc-200 dark:border-zinc-800 p-0.5">
			<button
				type="button"
				disabled={fontSize <= 70}
				onclick={() => onFontSizeChange(Math.max(70, fontSize - 10))}
				class="px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-xs font-medium disabled:opacity-30 transition-colors cursor-pointer"
				title="Decrease font size"
				aria-label="Decrease font size"
			>
				A-
			</button>

			<span class="px-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-300">{fontSize}%</span>

			<button
				type="button"
				disabled={fontSize >= 180}
				onclick={() => onFontSizeChange(Math.min(180, fontSize + 10))}
				class="px-2 py-0.5 rounded text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-xs font-medium disabled:opacity-30 transition-colors cursor-pointer"
				title="Increase font size"
				aria-label="Increase font size"
			>
				A+
			</button>
		</div>
	</div>

	<!-- Layout Switcher: Hybrid vs Monospace -->
	<div class="flex items-center bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60">
		<button
			type="button"
			onclick={() => onLayoutModeChange('hybrid')}
			class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer {layoutMode === 'hybrid'
				? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
				: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}"
			title="Modern Syllable-anchored chords directly above lyrics"
		>
			Hybrid
		</button>
		<button
			type="button"
			onclick={() => onLayoutModeChange('monospace')}
			class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer {layoutMode === 'monospace'
				? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-semibold'
				: 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}"
			title="Classic Fixed-width Courier layout"
		>
			Monospace
		</button>
	</div>

	<!-- Auto-Scroll Button -->
	<button
		type="button"
		onclick={onToggleAutoScroll}
		class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer {isAutoScrolling
			? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
			: 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}"
	>
		{#if isAutoScrolling}
			<Pause class="w-3.5 h-3.5" />
			<span>Pause</span>
		{:else}
			<Play class="w-3.5 h-3.5" />
			<span>Auto-Scroll</span>
		{/if}
	</button>
</div>
