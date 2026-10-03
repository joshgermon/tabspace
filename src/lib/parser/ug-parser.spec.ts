import { describe, it, expect } from 'vitest';
import {
	decodeEntities,
	isTablatureLine,
	isHeader,
	extractChordsWithPositions,
	buildMonospaceChordLineChunks,
	alignChordsToLyrics,
	parseUGContent,
	getAllUniqueChords
} from './ug-parser';

describe('ug-parser', () => {
	it('formats monospace chord line chunks preserving exact column alignment', () => {
		const rawLine = '[ch]F#m7[/ch]          [ch]A[/ch]';
		// Transpose F#m7 (4 chars) to Gm (2 chars)
		const chunks = buildMonospaceChordLineChunks(rawLine, (c) => (c === 'F#m7' ? 'Gm' : c));
		expect(chunks).toEqual([
			{ type: 'chord', text: 'Gm', chord: 'Gm' },
			{ type: 'space', text: '            ' }, // 12 spaces so chord A starts at col 14
			{ type: 'chord', text: 'A', chord: 'A' }
		]);
	});
	it('decodes HTML entities correctly', () => {
		expect(decodeEntities('don&#039;t &amp; &quot;hello&quot;')).toBe("don't & \"hello\"");
	});

	it('identifies tablature lines', () => {
		expect(isTablatureLine('e|---0---3---|')).toBe(true);
		expect(isTablatureLine('B|---1---0---|')).toBe(true);
		expect(isTablatureLine('G|---2---0---|')).toBe(true);
		expect(isTablatureLine('Just some lyrics')).toBe(false);
	});

	it('identifies section headers', () => {
		expect(isHeader('[Intro]')).toBe(true);
		expect(isHeader('[Verse 1]')).toBe(true);
		expect(isHeader('[Chorus]')).toBe(true);
		expect(isHeader('[Guitar Solo]')).toBe(true);
		expect(isHeader('[Outro]')).toBe(true);
		expect(isHeader('Not a [header]')).toBe(false);
	});

	it('extracts chords with character positions', () => {
		const rawLine = '[ch]F#m7[/ch]          [ch]A[/ch]';
		const { chords, plainChordLine } = extractChordsWithPositions(rawLine);
		expect(chords).toEqual([
			{ chord: 'F#m7', col: 0 },
			{ chord: 'A', col: 14 }
		]);
		expect(plainChordLine).toBe('F#m7          A');
	});

	it('aligns chords to lyrics into syllable segments', () => {
		const chordLine = '[ch]F#m7[/ch]          [ch]A[/ch]';
		const lyricLine = 'Today is gonna be the day';
		const segments = alignChordsToLyrics(chordLine, lyricLine);

		expect(segments.length).toBe(2);
		expect(segments[0].chord).toBe('F#m7');
		expect(segments[0].text).toBe('Today is gonna');
		expect(segments[1].chord).toBe('A');
		expect(segments[1].text).toBe(' be the day');
	});

	it('parses full sample UG content correctly', () => {
		const raw = `[Intro]
[ch]Em7[/ch] [ch]G[/ch] [ch]Dsus4[/ch] [ch]A7sus4[/ch]

[Verse 1]
[tab][ch]Em7[/ch]          [ch]G[/ch]
Today is gonna be the day[/tab]
[tab]              [ch]Dsus4[/ch]                 [ch]A7sus4[/ch]
That they're gonna throw it back to you[/tab]

[tab]e|---0---3---|
B|---1---0---|
G|---2---0---|[/tab]`;

		const parsed = parseUGContent(raw);

		expect(parsed.some((p) => p.type === 'header' && p.text === 'Intro')).toBe(true);
		expect(parsed.some((p) => p.type === 'chords-only')).toBe(true);
		expect(parsed.some((p) => p.type === 'chord-lyric')).toBe(true);
		expect(parsed.some((p) => p.type === 'tablature')).toBe(true);

		const uniqueChords = getAllUniqueChords(parsed);
		expect(uniqueChords).toContain('Em7');
		expect(uniqueChords).toContain('G');
		expect(uniqueChords).toContain('Dsus4');
		expect(uniqueChords).toContain('A7sus4');
	});
});
