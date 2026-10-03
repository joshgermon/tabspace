<script lang="ts">
	import ChordDiagram from './ChordDiagram.svelte';
	import type { ChordDiagramData } from '$lib/music/chords';
	import { X, ChevronLeft, ChevronRight } from 'lucide-svelte';

	interface Props {
		chordName: string;
		variations: ChordDiagramData[];
		isOpen: boolean;
		anchorX: number;
		anchorY: number;
		onClose: () => void;
	}

	let { chordName, variations, isOpen, anchorX, anchorY, onClose }: Props = $props();

	let currentVarIndex = $state(0);

	// Reset index when chord changes
	$effect(() => {
		if (chordName) {
			currentVarIndex = 0;
		}
	});

	let currentChord = $derived(
		variations.length > 0
			? variations[currentVarIndex]
			: { frets: [-1, -1, -1, -1, -1, -1], name: chordName }
	);

	function prevVar() {
		if (currentVarIndex > 0) currentVarIndex--;
		else currentVarIndex = variations.length - 1;
	}

	function nextVar() {
		if (currentVarIndex < variations.length - 1) currentVarIndex++;
		else currentVarIndex = 0;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop for mobile tap-outside -->
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/20 backdrop-blur-2xs md:hidden"
		onclick={onClose}
		aria-label="Close chord popup"
	></button>

	<!-- Popover Container -->
	<div
		class="fixed z-50 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl p-3 text-zinc-900 dark:text-zinc-100 flex flex-col items-center animate-in fade-in zoom-in-95 duration-100"
		style="left: {Math.max(16, Math.min(anchorX - 85, window.innerWidth - 190))}px; top: {Math.max(16, anchorY - 210)}px;"
	>
		<!-- Header -->
		<div class="w-full flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
			<span class="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">{chordName}</span>
			<button
				onclick={onClose}
				class="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
				aria-label="Close"
			>
				<X class="w-3.5 h-3.5" />
			</button>
		</div>

		<!-- Chord Diagram -->
		<div class="py-1">
			<ChordDiagram chord={currentChord} width={130} height={150} showName={false} />
		</div>

		<!-- Variation Controls -->
		{#if variations.length > 1}
			<div class="flex items-center justify-between w-full pt-1.5 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
				<button
					onclick={prevVar}
					class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
					aria-label="Previous variation"
				>
					<ChevronLeft class="w-3.5 h-3.5" />
				</button>
				<span class="font-mono">Var {currentVarIndex + 1}/{variations.length}</span>
				<button
					onclick={nextVar}
					class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
					aria-label="Next variation"
				>
					<ChevronRight class="w-3.5 h-3.5" />
				</button>
			</div>
		{/if}
	</div>
{/if}
