<script lang="ts">
	import type { ChordDiagramData } from '$lib/music/chords';

	interface Props {
		chord: ChordDiagramData;
		width?: number;
		height?: number;
		showName?: boolean;
	}

	let { chord, width = 110, height = 130, showName = true }: Props = $props();

	// SVG Dimensions
	const svgWidth = 140;
	const svgHeight = 170;

	// Grid layout
	const startX = 25;
	const startY = 40;
	const stringSpacing = 18;
	const fretSpacing = 22;
	const numStrings = 6;
	const numFrets = 4;

	// Derived values
	let baseFret = $derived(chord.baseFret && chord.baseFret > 1 ? chord.baseFret : 1);
	let frets = $derived(chord.frets || [-1, -1, -1, -1, -1, -1]);
	let fingers = $derived(chord.fingers || [0, 0, 0, 0, 0, 0]);
</script>

<div class="inline-flex flex-col items-center">
	{#if showName && chord.name}
		<span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-0.5 tracking-tight font-mono">{chord.name}</span>
	{/if}

	<svg
		viewBox="0 0 {svgWidth} {svgHeight}"
		width={width}
		height={height}
		class="select-none overflow-visible"
	>
		<!-- Base Fret indicator if not open position -->
		{#if baseFret > 1}
			<text
				x={startX - 14}
				y={startY + fretSpacing / 2 + 5}
				font-size="11"
				font-weight="bold"
				fill="currentColor"
				class="text-indigo-600 dark:text-indigo-400 font-mono"
				text-anchor="middle"
			>
				{baseFret}fr
			</text>
		{/if}

		<!-- Nut (Thick line if baseFret === 1) -->
		<line
			x1={startX}
			y1={startY}
			x2={startX + (numStrings - 1) * stringSpacing}
			y2={startY}
			stroke="currentColor"
			stroke-width={baseFret === 1 ? '3.5' : '1.5'}
			stroke-linecap="round"
			class={baseFret === 1 ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400 dark:text-zinc-600'}
		/>

		<!-- Fret lines (horizontal) -->
		{#each Array(numFrets + 1) as _, i}
			{#if i > 0}
				<line
					x1={startX}
					y1={startY + i * fretSpacing}
					x2={startX + (numStrings - 1) * stringSpacing}
					y2={startY + i * fretSpacing}
					stroke="currentColor"
					stroke-width="1.2"
					class="text-zinc-300 dark:text-zinc-800"
				/>
			{/if}
		{/each}

		<!-- String lines (vertical) -->
		{#each Array(numStrings) as _, i}
			<line
				x1={startX + i * stringSpacing}
				y1={startY}
				x2={startX + i * stringSpacing}
				y2={startY + numFrets * fretSpacing}
				stroke="currentColor"
				stroke-width={i >= 3 ? '1.5' : '1.1'}
				class="text-zinc-400 dark:text-zinc-700"
			/>
		{/each}

		<!-- Markers above nut: X (mute) or O (open) -->
		{#each frets as fret, strIdx}
			{@const xPos = startX + strIdx * stringSpacing}
			{#if fret === -1}
				<!-- Muted (X) -->
				<text
					x={xPos}
					y={startY - 7}
					font-size="11"
					font-weight="bold"
					fill="currentColor"
					text-anchor="middle"
					class="text-zinc-400 dark:text-zinc-500 font-sans"
				>
					×
				</text>
			{:else if fret === 0}
				<!-- Open (O) -->
				<circle
					cx={xPos}
					cy={startY - 9}
					r="3.5"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					class="text-indigo-600 dark:text-indigo-400"
				/>
			{/if}
		{/each}

		<!-- Barres -->
		{#if chord.barres && chord.barres.length > 0}
			{#each chord.barres as barre}
				{@const barreFretOffset = barre.fret - baseFret + 1}
				{#if barreFretOffset >= 1 && barreFretOffset <= numFrets}
					{@const x1 = startX + barre.startString * stringSpacing}
					{@const x2 = startX + barre.lastString * stringSpacing}
					{@const y = startY + (barreFretOffset - 0.5) * fretSpacing}
					<rect
						x={Math.min(x1, x2) - 6}
						y={y - 6}
						width={Math.abs(x2 - x1) + 12}
						height="12"
						rx="6"
						fill="currentColor"
						class="text-indigo-600 dark:text-indigo-500 opacity-90"
					/>
				{/if}
			{/each}
		{/if}

		<!-- Fretted dots with finger numbers -->
		{#each frets as fret, strIdx}
			{#if fret > 0}
				{@const fretOffset = fret - baseFret + 1}
				{#if fretOffset >= 1 && fretOffset <= numFrets}
					{@const xPos = startX + strIdx * stringSpacing}
					{@const yPos = startY + (fretOffset - 0.5) * fretSpacing}
					{@const finger = fingers[strIdx]}

					<circle
						cx={xPos}
						cy={yPos}
						r="6.5"
						fill="currentColor"
						class="text-indigo-600 dark:text-indigo-500"
					/>

					{#if finger && finger > 0}
						<text
							x={xPos}
							y={yPos + 3.5}
							font-size="9"
							font-weight="bold"
							fill="white"
							text-anchor="middle"
							class="text-white font-sans"
						>
							{finger}
						</text>
					{/if}
				{/if}
			{/if}
		{/each}
	</svg>
</div>
