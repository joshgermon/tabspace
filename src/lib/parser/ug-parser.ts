// Ultimate Guitar tab & chords parser

export interface ChordLyricSegment {
	chord?: string;
	text: string;
}

export type ParsedItem =
	| { type: 'header'; text: string }
	| { type: 'tablature'; lines: string[] }
	| {
			type: 'chord-lyric';
			chordLineRaw: string;
			lyricLineRaw: string;
			segments: ChordLyricSegment[];
	  }
	| { type: 'chords-only'; chords: string[]; raw: string }
	| { type: 'text'; text: string };

/**
 * Strips HTML entity codes commonly returned in UG data
 */
export function decodeEntities(str: string): string {
	return str
		.replace(/&#039;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&apos;/g, "'");
}

/**
 * Checks if a line contains guitar tablature strings (e.g. e|---, B|---, G|---, etc.)
 */
export function isTablatureLine(line: string): boolean {
	return /^[eEaAdDgGbB1-6]?[\|:][\d\-~hpbr/\s\|()xX]+[\|:]?$/.test(line.trim()) ||
		/^[\d\-~hpbr/\s\|()xX]{8,}$/.test(line.trim());
}

/**
 * Checks if a string looks like a section header, e.g., [Verse 1], [Chorus], [Intro], [Solo]
 */
export function isHeader(line: string): boolean {
	const trimmed = line.trim();
	return /^\[(Intro|Verse|Chorus|Bridge|Solo|Guitar Solo|Outro|Interlude|Pre-Chorus|Hook|Break|Instrumental|Refrain|Ending|Riff)[^\]]*\]$/i.test(
		trimmed
	);
}

/**
 * Extracts chords and their column indices from a chord line with [ch] tags.
 * e.g., "[ch]Am[/ch]   [ch]C[/ch]" -> [{ chord: 'Am', col: 0 }, { chord: 'C', col: 5 }]
 */
export function extractChordsWithPositions(rawLine: string): {
	chords: { chord: string; col: number }[];
	plainChordLine: string;
} {
	const chords: { chord: string; col: number }[] = [];
	let plainLine = '';
	let idx = 0;

	// Regex to match [ch]...[/ch]
	const regex = /\[ch\](.*?)\[\/ch\]/g;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(rawLine)) !== null) {
		const chord = match[1];
		// Text between previous index and this match
		const before = rawLine.slice(idx, match.index);
		plainLine += before;
		const col = plainLine.length;
		chords.push({ chord, col });
		plainLine += chord;
		idx = match.index + match[0].length;
	}

	plainLine += rawLine.slice(idx);
	return { chords, plainChordLine: plainLine };
}

export interface MonospaceChunk {
	type: 'chord' | 'space';
	text: string;
	chord?: string;
}

/**
 * Formats a monospace chord line with transposition while preserving exact column alignment
 */
export function buildMonospaceChordLineChunks(
	rawLine: string,
	transposeFn: (chord: string) => string
): MonospaceChunk[] {
	const { chords } = extractChordsWithPositions(rawLine);
	if (chords.length === 0) {
		return [{ type: 'space', text: rawLine.replace(/\[\/?ch\]/g, '') }];
	}

	const chunks: MonospaceChunk[] = [];
	let currentCol = 0;

	for (let i = 0; i < chords.length; i++) {
		const targetCol = chords[i].col;
		const originalChord = chords[i].chord;
		const transposed = transposeFn(originalChord);

		// Pad spaces up to targetCol
		if (targetCol > currentCol) {
			const spaceCount = targetCol - currentCol;
			chunks.push({ type: 'space', text: ' '.repeat(spaceCount) });
			currentCol = targetCol;
		} else if (i > 0 && targetCol <= currentCol) {
			// At least 1 space between chords if transposed chord expanded
			chunks.push({ type: 'space', text: ' ' });
			currentCol += 1;
		}

		chunks.push({ type: 'chord', text: transposed, chord: transposed });
		currentCol += transposed.length;
	}

	return chunks;
}

/**
 * Align chords to lyrics to generate syllable/segment pairs
 */
export function alignChordsToLyrics(
	rawChordLine: string,
	rawLyricLine: string
): ChordLyricSegment[] {
	const { chords } = extractChordsWithPositions(rawChordLine);
	const lyric = rawLyricLine;

	if (chords.length === 0) {
		return [{ text: lyric }];
	}

	const segments: ChordLyricSegment[] = [];

	// If there is lyric text before the first chord
	if (chords[0].col > 0) {
		const prefix = lyric.slice(0, chords[0].col);
		if (prefix) {
			segments.push({ text: prefix });
		}
	}

	for (let i = 0; i < chords.length; i++) {
		const current = chords[i];
		const nextCol = i + 1 < chords.length ? chords[i + 1].col : lyric.length;
		const start = Math.min(current.col, lyric.length);
		const end = Math.min(nextCol, lyric.length);
		const segmentText = lyric.slice(start, end);

		segments.push({
			chord: current.chord,
			text: segmentText || ' '
		});
	}

	// Any remaining lyric text after the last chord
	const lastEnd = chords.length > 0 ? chords[chords.length - 1].col : 0;
	if (lastEnd < lyric.length && segments.length > 0) {
		// already covered by end = lyric.length above
	}

	return segments;
}

/**
 * Parses raw Ultimate Guitar wiki content into structured items
 */
export function parseUGContent(rawContent: string): ParsedItem[] {
	if (!rawContent) return [];

	const decoded = decodeEntities(rawContent);
	const rawLines = decoded.split(/\r?\n/);
	const items: ParsedItem[] = [];

	let i = 0;
	while (i < rawLines.length) {
		const line = rawLines[i];
		const trimmed = line.trim();

		// Blank lines
		if (!trimmed) {
			items.push({ type: 'text', text: '' });
			i++;
			continue;
		}

		// Section headers
		if (isHeader(trimmed)) {
			// Strip outer brackets for clean display
			const headerTitle = trimmed.replace(/^\[|\]$/g, '');
			items.push({ type: 'header', text: headerTitle });
			i++;
			continue;
		}

		// Check for [tab] blocks
		if (line.includes('[tab]')) {
			// Tab block can contain multi-line tablature or chord+lyric pairs
			const tabLines: string[] = [];
			let tabEnd = false;

			while (i < rawLines.length && !tabEnd) {
				let currentLine = rawLines[i];
				if (currentLine.includes('[/tab]')) {
					tabEnd = true;
				}
				// Remove [tab] and [/tab] tags
				const cleanLine = currentLine.replace(/\[\/?tab\]/g, '');
				if (cleanLine.length > 0 || currentLine.length > 0) {
					tabLines.push(cleanLine);
				}
				i++;
			}

			// Check if tabLines are tablature strings (e|---)
			const hasTablature = tabLines.some((l) => isTablatureLine(l));
			if (hasTablature) {
				items.push({ type: 'tablature', lines: tabLines });
				continue;
			}

			// Otherwise, treat lines inside [tab] as chord+lyric pairs or chords
			let j = 0;
			while (j < tabLines.length) {
				const current = tabLines[j];
				const next = j + 1 < tabLines.length ? tabLines[j + 1] : undefined;

				if (current.includes('[ch]')) {
					if (next && !next.includes('[ch]') && next.trim().length > 0 && !isTablatureLine(next)) {
						// Paired: current is chord, next is lyric
						const segments = alignChordsToLyrics(current, next);
						items.push({
							type: 'chord-lyric',
							chordLineRaw: current,
							lyricLineRaw: next,
							segments
						});
						j += 2;
						continue;
					} else {
						// Just chords without a lyric line below
						const { chords } = extractChordsWithPositions(current);
						items.push({
							type: 'chords-only',
							chords: chords.map((c) => c.chord),
							raw: current
						});
						j++;
						continue;
					}
				} else {
					items.push({ type: 'text', text: current });
					j++;
				}
			}
			continue;
		}

		// Check if standalone tablature line
		if (isTablatureLine(line)) {
			const tabLines: string[] = [line];
			i++;
			while (i < rawLines.length && (isTablatureLine(rawLines[i]) || rawLines[i].trim() === '')) {
				if (rawLines[i].trim() !== '') {
					tabLines.push(rawLines[i]);
				}
				i++;
			}
			items.push({ type: 'tablature', lines: tabLines });
			continue;
		}

		// Check if line has [ch] chords
		if (line.includes('[ch]')) {
			const next = i + 1 < rawLines.length ? rawLines[i + 1] : undefined;
			if (next && !next.includes('[ch]') && next.trim().length > 0 && !isHeader(next) && !isTablatureLine(next)) {
				// Paired chords + lyrics
				const segments = alignChordsToLyrics(line, next);
				items.push({
					type: 'chord-lyric',
					chordLineRaw: line,
					lyricLineRaw: next,
					segments
				});
				i += 2;
				continue;
			} else {
				// Chords only
				const { chords } = extractChordsWithPositions(line);
				items.push({
					type: 'chords-only',
					chords: chords.map((c) => c.chord),
					raw: line
				});
				i++;
				continue;
			}
		}

		// Regular text line
		items.push({ type: 'text', text: line });
		i++;
	}

	return items;
}

/**
 * Extracts a unique list of all chord names in the parsed items
 */
export function getAllUniqueChords(items: ParsedItem[]): string[] {
	const set = new Set<string>();

	for (const item of items) {
		if (item.type === 'chords-only') {
			for (const c of item.chords) set.add(c);
		} else if (item.type === 'chord-lyric') {
			for (const seg of item.segments) {
				if (seg.chord) set.add(seg.chord);
			}
		}
	}

	return Array.from(set);
}
