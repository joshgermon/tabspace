<script lang="ts">
	import type { ParsedItem } from '$lib/parser/ug-parser';
	import { buildMonospaceChordLineChunks } from '$lib/parser/ug-parser';
	import { transposeChord } from '$lib/music/chords';

	interface Props {
		items: ParsedItem[];
		transposeOffset: number; // total semitones shift (transpose + capo adjustment)
		layoutMode: 'hybrid' | 'monospace';
		fontSize: number; // percentage
		onChordClick: (chord: string, x: number, y: number) => void;
	}

	let { items, transposeOffset, layoutMode, fontSize, onChordClick }: Props = $props();

	function getTransposed(chord: string): string {
		if (transposeOffset === 0) return chord;
		return transposeChord(chord, transposeOffset);
	}

	function handleChordClick(chord: string, event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		onChordClick(chord, rect.left + rect.width / 2, rect.top);
	}
</script>

<div
	class="tab-content w-full transition-all select-text"
	style="font-size: {fontSize}%;"
>
	{#if layoutMode === 'hybrid'}
		<!-- HYBRID MODE: Chords floating over lyric syllables + Monospace for guitar tabs -->
		<div class="flex flex-col gap-2">
			{#each items as item, itemIdx (itemIdx)}
				{#if item.type === 'header'}
					<div class="pt-6 pb-2 flex items-center gap-3">
						<span class="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/20 px-2.5 py-0.5 rounded-md">
							{item.text}
						</span>
						<div class="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
					</div>

				{:else if item.type === 'tablature'}
					<div class="my-2 bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 overflow-x-auto scrollbar-thin">
						<pre class="font-mono text-zinc-300 leading-tight text-xs sm:text-sm selection:bg-indigo-500/30 whitespace-pre">{item.lines.join('\n')}</pre>
					</div>

				{:else if item.type === 'chord-lyric'}
					<div class="chord-lyric-row flex flex-wrap items-end my-1">
						{#each item.segments as segment, segIdx}
							<div class="segment inline-flex flex-col items-start align-bottom mr-1">
								{#if segment.chord}
									{@const transposed = getTransposed(segment.chord)}
									<button
										type="button"
										onclick={(e) => handleChordClick(transposed, e)}
										class="chord-badge text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-mono font-semibold text-xs sm:text-sm leading-tight px-1 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/15 transition-colors cursor-pointer select-none"
										title="View chord diagram for {transposed}"
									>
										{transposed}
									</button>
								{:else}
									<span class="h-5" aria-hidden="true"></span>
								{/if}
								<span class="lyric-text text-zinc-900 dark:text-zinc-100 font-normal leading-relaxed whitespace-pre">
									{segment.text}
								</span>
							</div>
						{/each}
					</div>

				{:else if item.type === 'chords-only'}
					<div class="flex flex-wrap items-center gap-2 py-1.5 my-1 bg-zinc-100 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
						{#each item.chords as chord}
							{@const transposed = getTransposed(chord)}
							<button
								type="button"
								onclick={(e) => handleChordClick(transposed, e)}
								class="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-mono font-semibold text-xs sm:text-sm border border-zinc-200 dark:border-zinc-700/80 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors cursor-pointer"
								title="View chord diagram for {transposed}"
							>
								{transposed}
							</button>
						{/each}
					</div>

				{:else if item.type === 'text'}
					{#if item.text.trim() === ''}
						<div class="h-3"></div>
					{:else}
						<div class="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed py-0.5">
							{item.text}
						</div>
					{/if}
				{/if}
			{/each}
		</div>

	{:else}
		<!-- MONOSPACE MODE: Fixed-Width Character Aligned Layout -->
		<div class="bg-white dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 overflow-x-auto scrollbar-thin shadow-2xs font-mono text-xs sm:text-sm leading-relaxed">
			{#each items as item}
				{#if item.type === 'header'}
					<div class="font-sans text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 pt-5 pb-1">
						[{item.text}]
					</div>
				{:else if item.type === 'tablature'}
					<div class="text-zinc-700 dark:text-zinc-300 whitespace-pre">{item.lines.join('\n')}</div>
				{:else if item.type === 'chord-lyric'}
					<!-- Chord Line: padded to exact character columns -->
					<div class="chord-line whitespace-pre select-none font-bold text-indigo-600 dark:text-indigo-400 leading-none pt-1">
						{#each buildMonospaceChordLineChunks(item.chordLineRaw, getTransposed) as chunk}
							{#if chunk.type === 'chord'}
								<button
									type="button"
									onclick={(e) => handleChordClick(chunk.text, e)}
									class="hover:underline cursor-pointer select-none inline font-bold"
									title="View diagram for {chunk.text}"
								>{chunk.text}</button>
							{:else}
								<span>{chunk.text}</span>
							{/if}
						{/each}
					</div>
					<!-- Lyric Line: aligned beneath chords -->
					<div class="lyric-line whitespace-pre text-zinc-900 dark:text-zinc-100 leading-relaxed pb-1">
						{item.lyricLineRaw}
					</div>
				{:else if item.type === 'chords-only'}
					<div class="chord-line whitespace-pre font-bold text-indigo-600 dark:text-indigo-400 py-1">
						{#each buildMonospaceChordLineChunks(item.raw, getTransposed) as chunk}
							{#if chunk.type === 'chord'}
								<button
									type="button"
									onclick={(e) => handleChordClick(chunk.text, e)}
									class="hover:underline cursor-pointer select-none inline font-bold"
									title="View diagram for {chunk.text}"
								>{chunk.text}</button>
							{:else}
								<span>{chunk.text}</span>
							{/if}
						{/each}
					</div>
				{:else if item.type === 'text'}
					{#if item.text.trim() === ''}
						<div class="h-3"></div>
					{:else}
						<div class="text-zinc-500 dark:text-zinc-400 whitespace-pre py-0.5">{item.text}</div>
					{/if}
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.chord-badge {
		user-select: none;
	}
	.chord-lyric-row {
		min-height: 2.2rem;
	}
</style>
