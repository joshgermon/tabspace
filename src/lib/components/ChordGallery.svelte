<script lang="ts">
	import ChordDiagram from './ChordDiagram.svelte';
	import type { ChordDiagramData } from '$lib/music/chords';
	import { COMMON_CHORD_LIBRARY } from '$lib/music/chords';
	import { ChevronDown, ChevronUp, Music2 } from 'lucide-svelte';

	interface Props {
		chords: string[];
		diagramsMap: Record<string, ChordDiagramData[]>;
		onSelectChord?: (chord: string, x: number, y: number) => void;
	}

	let { chords, diagramsMap, onSelectChord }: Props = $props();

	let isExpanded = $state(true);

	function getDiagram(chordName: string): ChordDiagramData {
		const variations = diagramsMap[chordName];
		if (variations && variations.length > 0) {
			return variations[0];
		}
		const fallback = COMMON_CHORD_LIBRARY[chordName];
		if (fallback) {
			return { ...fallback, name: chordName };
		}
		return { frets: [-1, -1, -1, -1, -1, -1], name: chordName };
	}
</script>

{#if chords && chords.length > 0}
	<div class="w-full bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mb-6 shadow-2xs">
		<button
			type="button"
			onclick={() => (isExpanded = !isExpanded)}
			class="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
		>
			<div class="flex items-center gap-2">
				<Music2 class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
				<span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
					Chords in this song ({chords.length})
				</span>
			</div>
			<div class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
				{#if isExpanded}
					<ChevronUp class="w-4 h-4" />
				{:else}
					<ChevronDown class="w-4 h-4" />
				{/if}
			</div>
		</button>

		{#if isExpanded}
			<div class="p-3 pt-1 flex items-center gap-3 overflow-x-auto scrollbar-thin">
				{#each chords as chord}
					{@const diagram = getDiagram(chord)}
					<button
						type="button"
						onclick={(e) => {
							const rect = e.currentTarget.getBoundingClientRect();
							onSelectChord?.(chord, rect.left + rect.width / 2, rect.top);
						}}
						class="flex-shrink-0 flex flex-col items-center bg-zinc-50 dark:bg-zinc-950/70 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-400/50 p-2 rounded-lg transition-all cursor-pointer group"
						title="Click to inspect variations for {chord}"
					>
						<ChordDiagram chord={diagram} width={90} height={110} showName={true} />
					</button>
				{/each}
			</div>
		{/if}
	</div>
{/if}
